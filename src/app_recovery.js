import {
  LitElement,
  html,
  nothing,
  classMap,
  choose,
  guard,
} from "/vendor/@lit/all@3.1.2/lit-all.min.js";

// Add shoelace once. Use components anywhere.
import { setBasePath } from "/vendor/@shoelace/cdn@2.14.0/utilities/base-path.js";
import "/vendor/@shoelace/cdn@2.14.0/shoelace.js";

// Import stylesheets
import { appModeStyles } from "/components/layouts/recovery/styles/index.js";
import { navStyles } from "/components/layouts/recovery/renders/nav.js";

// Views
import "/components/views/action-login/index.js";
import "/components/views/action-change-pass/index.js";
import "/components/views/action-create-key/index.js";
import "/components/views/action-select-network/index.js";
import "/components/views/action-setup-progress/index.js";
import "/components/views/action-select-install-location/index.js";
import "/components/views/action-system-settings/index.js";
import "/components/views/setup-dislaimer/index.js";
import "/components/views/confirmation-prompt/index.js";
import "/pages/page-recovery/index.js";

// Components
import "/components/common/dynamic-form/dynamic-form.js";
import "/utils/devtools/debug-panel.js";

// Render chunks
import * as renderChunks from "/components/layouts/recovery/renders/index.js";

// Store
import { store } from "/state/store.js";
import { StoreSubscriber } from "/state/subscribe.js";

// Utils
import { bindToClass } from "/utils/class-bind.js";
import { asyncTimeout } from "/utils/timeout.js";
import { instruction } from "/components/common/instruction.js";

// APIS
import { getSetupBootstrap } from "/api/system/get-bootstrap.js";
import { getRecoveryBootstrap } from "/api/system/get-recovery-bootstrap.js";
import { postHostReboot } from "/api/system/post-host-reboot.js";
import { postHostShutdown } from "/api/system/post-host-shutdown.js";

// Main WebSocket channel (singleton)
import { mainChannel } from "/controllers/sockets/main-channel.js";

// Do this once to set the location of shoelace assets (icons etc..)
setBasePath("/vendor/@shoelace/cdn@2.14.0/");

const STEP_LOGIN = 0;
const STEP_INTRO = 1;
const STEP_SYS_SETTINGS = 2;
const STEP_SET_PASSWORD = 3;
const STEP_GENERATE_KEY = 4;
const STEP_NETWORK = 5;
const STEP_BOOTSTRAP = 6;
const STEP_DONE = 7;
const STEP_INSTALL = 8;
const SETUP_STEP_STORAGE_KEY = "recovery-setup-current-step";
const STEP_NAMES = {
  [STEP_LOGIN]: "login",
  [STEP_INTRO]: "intro",
  [STEP_SYS_SETTINGS]: "system-settings",
  [STEP_SET_PASSWORD]: "set-password",
  [STEP_GENERATE_KEY]: "generate-key",
  [STEP_NETWORK]: "network",
  [STEP_BOOTSTRAP]: "bootstrap",
  [STEP_DONE]: "done",
  [STEP_INSTALL]: "install",
};

class AppModeApp extends LitElement {
  static styles = [appModeStyles, navStyles];
  static properties = {
    loading: { type: Boolean },
    isLoggedIn: { type: Boolean },
    activeStepNumber: { type: Number },
    setupState: { type: Object },
    isFirstTimeSetup: { type: Boolean },
    isForbidden: { type: Boolean },
    hasLoaded: { type: Boolean },
    bootstrapJobId: { type: String },
    bootstrapStartError: { type: String },
    installationState: { type: String },
    installationBootMedia: { type: String },
    renderReady: { type: Boolean },
  };

  constructor() {
    super();
    this.dialogMgmt = null;
    this.isLoggedIn = false;
    this.activeStepNumber = 0;
    this.setupState = null;
    this.isFirstTimeSetup = false;
    this.isForbidden = false;
    this.bootstrapJobId = null;
    this.bootstrapStartError = "";
    this.installationState = "notInstalled";
    this.installationBootMedia = "ro";
    this.hasLoaded = false;
    this.mainChannel = mainChannel;
    bindToClass(renderChunks, this);
    this.context = new StoreSubscriber(this, store);
    this._setupData = {
      initialDeviceName:
        window.location.hostname == "dogebox.local" ? "dogebox" : null,
    };
  }

  _logSetupFlow(message, details = {}) {
    console.log("[recovery-setup]", message, details);
  }

  _getStepName(stepNumber) {
    return STEP_NAMES[stepNumber] ?? `unknown-${stepNumber}`;
  }

  _readPersistedSetupStep() {
    try {
      const rawValue = window.sessionStorage.getItem(SETUP_STEP_STORAGE_KEY);
      if (rawValue === null) {
        return null;
      }

      const parsedValue = JSON.parse(rawValue);
      if (
        !parsedValue ||
        !Number.isInteger(parsedValue.stepNumber) ||
        typeof parsedValue.setupSessionId !== "string" ||
        !parsedValue.setupSessionId ||
        (parsedValue.bootstrapStartError !== undefined &&
          typeof parsedValue.bootstrapStartError !== "string")
      ) {
        this._clearPersistedSetupStep();
        return null;
      }

      if (typeof parsedValue.bootstrapStartError !== "string") {
        parsedValue.bootstrapStartError = "";
      }

      return parsedValue;
    } catch (error) {
      this._logSetupFlow("persistedStep:read-failed", { error });
      return null;
    }
  }

  _writePersistedSetupStep(stepNumber, setupSessionId, bootstrapStartError = "") {
    try {
      if (!setupSessionId) {
        this._logSetupFlow("persistedStep:write-skipped", {
          reason: "missing-setup-session-id",
          step: stepNumber,
          stepName: this._getStepName(stepNumber),
        });
        return;
      }

      window.sessionStorage.setItem(
        SETUP_STEP_STORAGE_KEY,
        JSON.stringify({
          stepNumber,
          setupSessionId,
          bootstrapStartError,
        }),
      );
      this._logSetupFlow("persistedStep:write", {
        step: stepNumber,
        stepName: this._getStepName(stepNumber),
        setupSessionId,
        hasBootstrapStartError: !!bootstrapStartError,
      });
    } catch (error) {
      this._logSetupFlow("persistedStep:write-failed", { error });
    }
  }

  _clearPersistedSetupStep() {
    try {
      window.sessionStorage.removeItem(SETUP_STEP_STORAGE_KEY);
      this._logSetupFlow("persistedStep:cleared");
    } catch (error) {
      this._logSetupFlow("persistedStep:clear-failed", { error });
    }
  }

  _getAllowedPersistedSteps(setupState) {
    const {
      hasCompletedInitialConfiguration,
      hasGeneratedKey,
      hasConfiguredNetwork,
      activeBootstrapJobId,
      isForbidden,
    } = setupState;

    if (isForbidden || hasCompletedInitialConfiguration) {
      return new Set();
    }

    const pristineSetup =
      !hasGeneratedKey && !hasConfiguredNetwork && !activeBootstrapJobId;

    if (pristineSetup) {
      return new Set([
        STEP_INTRO,
        STEP_SYS_SETTINGS,
        STEP_SET_PASSWORD,
        STEP_GENERATE_KEY,
      ]);
    }

    if (activeBootstrapJobId) {
      if (!this.isLoggedIn) {
        return new Set();
      }

      return new Set([
        STEP_INTRO,
        STEP_SYS_SETTINGS,
        STEP_SET_PASSWORD,
        STEP_GENERATE_KEY,
        STEP_NETWORK,
        STEP_BOOTSTRAP,
      ]);
    }

    if (hasGeneratedKey) {
      if (!this.isLoggedIn) {
        return new Set();
      }

      return new Set([
        STEP_INTRO,
        STEP_SYS_SETTINGS,
        STEP_SET_PASSWORD,
        STEP_GENERATE_KEY,
        STEP_NETWORK,
        STEP_BOOTSTRAP,
      ]);
    }

    return new Set([
      STEP_INTRO,
      STEP_SYS_SETTINGS,
      STEP_SET_PASSWORD,
      STEP_GENERATE_KEY,
    ]);
  }

  _resolvePersistedSetupStep(setupState, fallbackStep) {
    const persistedStep = this._readPersistedSetupStep();
    if (persistedStep === null) {
      return fallbackStep;
    }

    if (persistedStep.setupSessionId !== setupState.setupSessionId) {
      this._logSetupFlow("persistedStep:ignored", {
        reason: "setup-session-id-mismatch",
        persistedStep: persistedStep.stepNumber,
        persistedStepName: this._getStepName(persistedStep.stepNumber),
        persistedSetupSessionId: persistedStep.setupSessionId,
        currentSetupSessionId: setupState.setupSessionId,
        fallbackStep,
        fallbackStepName: this._getStepName(fallbackStep),
      });
      return fallbackStep;
    }

    const allowedSteps = this._getAllowedPersistedSteps(setupState);
    if (!allowedSteps.has(persistedStep.stepNumber)) {
      this._logSetupFlow("persistedStep:ignored", {
        reason: "step-not-allowed",
        persistedStep: persistedStep.stepNumber,
        persistedStepName: this._getStepName(persistedStep.stepNumber),
        fallbackStep,
        fallbackStepName: this._getStepName(fallbackStep),
      });
      return fallbackStep;
    }

    this._logSetupFlow("persistedStep:using", {
      persistedStep: persistedStep.stepNumber,
      persistedStepName: this._getStepName(persistedStep.stepNumber),
      setupSessionId: persistedStep.setupSessionId,
      fallbackStep,
      fallbackStepName: this._getStepName(fallbackStep),
    });
    return persistedStep.stepNumber;
  }

  set setupState(newValue) {
    this._setupState = newValue;
    if (newValue) {
      const stepNumber = this._determineStartingStep(newValue);
      this._logSetupFlow("setupState updated", {
        setupState: newValue,
        chosenStep: stepNumber,
        chosenStepName: this._getStepName(stepNumber),
        isLoggedIn: this.isLoggedIn,
      });
      this.activeStepNumber = stepNumber;
    }
  }

  get setupState() {
    return this._setupState;
  }

  connectedCallback() {
    super.connectedCallback();
    this.isLoggedIn = !!store.networkContext.token;
    this._logSetupFlow("connected", {
      isLoggedIn: this.isLoggedIn,
      hasToken: !!store.networkContext.token,
      location: window.location.href,
    });

    // Instantiate a web socket connection and add main app as an observer
    this.mainChannel.addObserver(this);

    this.fetchSetupState();
    this.fetchRecoveryState();
  }

  async fetchSetupState() {
    this.loading = true;
    this._logSetupFlow("fetchSetupState:start", {
      isLoggedIn: this.isLoggedIn,
      hasToken: !!store.networkContext.token,
    });
    const response = await getSetupBootstrap({ noLogoutRedirect: true });
    this._logSetupFlow("fetchSetupState:response", response);

    if (!response.success && response.status === 401) {
      this._logSetupFlow("fetchSetupState:forbidden", response);
      this.setupState = { isForbidden: true };
      this.loading = false;
      return;
    }

    if (!response.setupFacts) {
      // Only show alert if we're logged in
      if (this.isLoggedIn) {
        alert("Failed to fetch bootstrap.");
      }
      return;
    }

    this.devMode = response.devMode;
    this.setupState = response.setupFacts;
    this.loading = false;
  }

  async fetchRecoveryState() {
    this._logSetupFlow("fetchRecoveryState:start");
    const response = await getRecoveryBootstrap({ noLogoutRedirect: true });
    this._logSetupFlow("fetchRecoveryState:response", response);

    if (!response.recoveryFacts) {
      // Only show alert if we're logged in
      if (this.isLoggedIn) {
        alert("Failed to fetch bootstrap.");
      }
      return;
    }

    this.installationBootMedia =
      response.recoveryFacts.installationBootMedia ?? "ro";
    this.installationState =
      response.recoveryFacts.installationState ?? "notInstalled";
    this.hasLoaded = true;
  }

  _determineStartingStep(setupState) {
    const {
      hasCompletedInitialConfiguration,
      hasGeneratedKey,
      hasConfiguredNetwork,
      activeBootstrapJobId,
      isForbidden,
    } = setupState;
    const isPristineSetup =
      !hasGeneratedKey && !hasConfiguredNetwork && !activeBootstrapJobId;

    this._logSetupFlow("determineStartingStep:input", {
      setupState,
      isLoggedIn: this.isLoggedIn,
      bootstrapJobId: this.bootstrapJobId,
    });

    // First check if we're forbidden
    if (isForbidden) {
      this._logSetupFlow("determineStartingStep:result", {
        reason: "forbidden",
        step: STEP_LOGIN,
        stepName: this._getStepName(STEP_LOGIN),
      });
      return STEP_LOGIN;
    }

    if (!hasCompletedInitialConfiguration) {
      this.isFirstTimeSetup = true;

      if (isPristineSetup) {
        const resolvedStep = this.isLoggedIn
          ? STEP_INTRO
          : this._resolvePersistedSetupStep(setupState, STEP_INTRO);
        this._logSetupFlow("determineStartingStep:result", {
          reason: this.isLoggedIn
            ? "fresh-setup-pristine-with-stale-login"
            : "fresh-setup-pristine",
          step: resolvedStep,
          stepName: this._getStepName(resolvedStep),
        });
        return resolvedStep;
      }

      const persistedStep = this._readPersistedSetupStep();
      const hasPersistedBootstrapStartError =
        persistedStep?.setupSessionId === setupState.setupSessionId &&
        persistedStep.stepNumber === STEP_BOOTSTRAP &&
        !!persistedStep.bootstrapStartError;

      if (hasPersistedBootstrapStartError) {
        this.bootstrapStartError = persistedStep.bootstrapStartError;
        this._logSetupFlow("determineStartingStep:result", {
          reason: "persisted-bootstrap-start-error",
          step: STEP_BOOTSTRAP,
          stepName: this._getStepName(STEP_BOOTSTRAP),
        });
        return STEP_BOOTSTRAP;
      }

      if (!this.isLoggedIn) {
        if (hasGeneratedKey || hasConfiguredNetwork || activeBootstrapJobId) {
          this._logSetupFlow("determineStartingStep:result", {
            reason: "not-logged-in-but-partially-configured",
            step: STEP_LOGIN,
            stepName: this._getStepName(STEP_LOGIN),
          });
          return STEP_LOGIN;
        }
      }

      if (!hasGeneratedKey) {
        const resolvedStep = this._resolvePersistedSetupStep(
          setupState,
          STEP_GENERATE_KEY,
        );
        this._logSetupFlow("determineStartingStep:result", {
          reason: "logged-in-missing-generated-key",
          step: resolvedStep,
          stepName: this._getStepName(resolvedStep),
        });
        return resolvedStep;
      }
      if (activeBootstrapJobId) {
        this.bootstrapJobId = activeBootstrapJobId;
        const resolvedStep = this._resolvePersistedSetupStep(
          setupState,
          STEP_BOOTSTRAP,
        );
        this._logSetupFlow("determineStartingStep:result", {
          reason: "active-bootstrap-job",
          step: resolvedStep,
          stepName: this._getStepName(resolvedStep),
          bootstrapJobId: activeBootstrapJobId,
        });
        return resolvedStep;
      }
      if (!hasConfiguredNetwork) {
        const resolvedStep = this._resolvePersistedSetupStep(
          setupState,
          STEP_NETWORK,
        );
        this._logSetupFlow("determineStartingStep:result", {
          reason: "logged-in-missing-network",
          step: resolvedStep,
          stepName: this._getStepName(resolvedStep),
        });
        return resolvedStep;
      }
      this._logSetupFlow("determineStartingStep:result", {
        reason: "initial-config-finished-awaiting-done",
        step: STEP_DONE,
        stepName: this._getStepName(STEP_DONE),
      });
      return STEP_DONE;
    }

    // If we're already fully set up, or if we've generated a key, show our login step.
    if (!this.isLoggedIn) {
      this._logSetupFlow("determineStartingStep:result", {
        reason: "configured-but-not-logged-in",
        step: STEP_LOGIN,
        stepName: this._getStepName(STEP_LOGIN),
      });
      return STEP_LOGIN;
    }

    // Default to login if none of the above conditions are met
    this._logSetupFlow("determineStartingStep:result", {
      reason: "configured-and-logged-in",
      step: STEP_DONE,
      stepName: this._getStepName(STEP_DONE),
    });
    return STEP_DONE;
  }

  firstUpdated() {
    // Prevent dialog closures on overlay click
    this.dialogMgmt = this.shadowRoot.querySelector("#MgmtDialog");
    this.dialogMgmt.addEventListener("sl-request-close", (event) => {
      if (
        event.detail.source === "overlay" ||
        this.context.store.setupContext.preventClose
      ) {
        event.preventDefault();
      }
    });
    this.dialogMgmt.addEventListener("sl-after-hide", (event) => {
      if (event.target.id === "MgmtDialog") {
        store.updateState({
          setupContext: {
            view: null,
            hideViewClose: false,
            preventClose: false,
          },
        });
      }
    });
  }

  _nextStep = () => {
    const fromStep = this.activeStepNumber;
    this.isLoggedIn = this.context.store.networkContext.token;
    this.activeStepNumber++;
    this._logSetupFlow("nextStep", {
      fromStep,
      fromStepName: this._getStepName(fromStep),
      toStep: this.activeStepNumber,
      toStepName: this._getStepName(this.activeStepNumber),
      isLoggedIn: this.isLoggedIn,
    });
  };

  _goToStep = (stepNumber) => {
    const fromStep = this.activeStepNumber;
    this.activeStepNumber = stepNumber;
    this._logSetupFlow("goToStep", {
      fromStep,
      fromStepName: this._getStepName(fromStep),
      toStep: stepNumber,
      toStepName: this._getStepName(stepNumber),
    });
  };

  updated(changedProperties) {
    if (changedProperties.has("activeStepNumber")) {
      const previousStep = changedProperties.get("activeStepNumber");
      if (
        this.activeStepNumber >= STEP_INTRO &&
        this.activeStepNumber <= STEP_BOOTSTRAP
      ) {
        this._writePersistedSetupStep(
          this.activeStepNumber,
          this.setupState?.setupSessionId,
          this.activeStepNumber === STEP_BOOTSTRAP ? this.bootstrapStartError : "",
        );
      } else if (this.activeStepNumber === STEP_LOGIN && this.setupState) {
        this._clearPersistedSetupStep();
      }
      this._logSetupFlow("activeStepNumber changed", {
        previousStep,
        previousStepName:
          previousStep === undefined ? undefined : this._getStepName(previousStep),
        nextStep: this.activeStepNumber,
        nextStepName: this._getStepName(this.activeStepNumber),
      });
    }

    if (changedProperties.has("isLoggedIn")) {
      this._logSetupFlow("isLoggedIn changed", {
        previous: changedProperties.get("isLoggedIn"),
        next: this.isLoggedIn,
        hasToken: !!this.context.store.networkContext.token,
      });
    }

    if (
      changedProperties.has("bootstrapStartError") &&
      this.activeStepNumber === STEP_BOOTSTRAP
    ) {
      this._writePersistedSetupStep(
        this.activeStepNumber,
        this.setupState?.setupSessionId,
        this.bootstrapStartError,
      );
    }
  }

  disconnectedCallback() {
    this.mainChannel.removeObserver(this);
    super.disconnectedCallback();
  }

  performLogout(e) {
    if (!e.currentTarget.disabled) {
      this._clearPersistedSetupStep();
      store.updateState({ networkContext: { token: null } });
      window.location.reload();
    }
  }

  triggerReboot = async () => {
    try {
      instruction({
        img: "/static/img/again.png",
        text: "Rebooted.",
        subtext:
          "Please re-reconnect to the same network as your Dogebox and refresh.",
      });
      await asyncTimeout(500);
      await postHostReboot();
    } catch {
      // Ignore.
    }
  };

  triggerPoweroff = async () => {
    try {
      instruction({
        img: "/static/img/bye.png",
        text: "Dogebox turned off successfully.<br>You may close this page.",
        subtext: "",
      });
      await asyncTimeout(500);
      await postHostShutdown();
    } catch {
      // Ignore.
    }
  };

  _closeMgmtDialog = () => {
    store.updateState({
      setupContext: { view: null, hideViewClose: false, preventClose: false },
    });
  };

  render() {
    const navClasses = classMap({
      solid: true,
      hidden: this.activeStepNumber === STEP_LOGIN,
    });

    const stepWrapperClasses = classMap({
      "main-step-wrapper": this.activeStepNumber !== STEP_INTRO,
      "main-step-wrapper-disclaimer": this.activeStepNumber === STEP_INTRO,
    });

    const reflectorToken = this.context.store.networkContext.reflectorToken;

    return html`
      ${!this.setupState
        ? html`
            <div class="loader-overlay">
              <sl-spinner
                style="font-size: 2rem; --indicator-color: #bbb;"
              ></sl-spinner>
            </div>
          `
        : nothing}
      ${this.setupState
        ? html`
            <div id="App" class="chrome">
              <nav class="${navClasses}">
                ${guard(
                  [
                    this.activeStepNumber,
                    this.context.store.networkContext.token,
                  ],
                  () =>
                    this.renderNav(
                      this.activeStepNumber > STEP_LOGIN &&
                        this.activeStepNumber < STEP_DONE,
                    ),
                )}
              </nav>

              <main
                id="Main"
                style="padding-top: ${this.activeStepNumber > STEP_LOGIN &&
                this.activeStepNumber < STEP_DONE
                  ? "0px;"
                  : "100px"}"
              >
                <div class="${stepWrapperClasses}">
                  ${choose(
                    this.activeStepNumber,
                    [
                      [
                        STEP_LOGIN,
                        () =>
                          html`<x-action-login retainHash></x-action-login>`,
                      ],
                      [
                        STEP_INTRO,
                        () =>
                          html`<x-setup-dislaimer
                            .nextStep=${this._nextStep}
                          ></x-setup-dislaimer>`,
                      ],
                      [
                        STEP_SYS_SETTINGS,
                        () =>
                          html`<x-action-system-settings
                            .setupData=${this._setupData}
                            .onBack=${() => this._goToStep(STEP_INTRO)}
                            .onSuccess=${this._nextStep}
                          ></x-action-system-settings>`,
                      ],
                      [
                        STEP_SET_PASSWORD,
                        () =>
                          html`<x-action-change-pass
                            label="Secure your Dogebox"
                            buttonLabel="Next"
                            description="Devise a secure password used to encrypt your Dogebox Master Key."
                            retainHash
                            noSubmit
                            .onBack=${() => this._goToStep(STEP_SYS_SETTINGS)}
                            .onSuccess=${this._nextStep}
                          ></x-action-change-pass>`,
                      ],
                      [
                        STEP_GENERATE_KEY,
                        () =>
                          html`<x-action-create-key
                            .onBack=${() => this._goToStep(STEP_SET_PASSWORD)}
                            .onSuccess=${this._nextStep}
                          ></x-action-create-key>`,
                      ],
                      [
                        STEP_NETWORK,
                        () =>
                          html`<x-action-select-network
                            .onBack=${() => this._goToStep(STEP_GENERATE_KEY)}
                            .onStart=${() => {
                              this.bootstrapJobId = "";
                              this.bootstrapStartError = "";
                              this._nextStep();
                            }}
                            .onSuccess=${(jobId) => {
                              this.bootstrapJobId = jobId;
                              this.bootstrapStartError = "";
                            }}
                            .onBootstrapStartFailed=${(errorMessage) => {
                              this.bootstrapJobId = null;
                              this.bootstrapStartError = errorMessage;
                            }}
                            .reflectorToken=${reflectorToken}
                          ></x-action-select-network>`,
                      ],
                      [
                        STEP_BOOTSTRAP,
                        () =>
                          html`<x-action-setup-progress
                            .jobId=${this.bootstrapJobId}
                            .startErrorMessage=${this.bootstrapStartError}
                            .onBack=${() => this._goToStep(STEP_NETWORK)}
                            .onSuccess=${() => {
                              this._nextStep();
                            }}
                            .onFailure=${() => {
                              this.bootstrapJobId = null;
                              this.bootstrapStartError = "";
                              this._goToStep(STEP_NETWORK);
                            }}
                          ></x-action-setup-progress>`,
                      ],
                      [
                        STEP_DONE,
                        () =>
                          html`<x-page-recovery
                            .setupData=${this._setupData}
                            .reflectorToken=${reflectorToken}
                            .isFirstTimeSetup=${this.isFirstTimeSetup}
                          ></x-page-recovery>`,
                      ],
                    ],
                    () => html`<h1>Error</h1>`,
                  )}
                </div>
                ${this.isFirstTimeSetup && !this.devMode
                  ? html`
                      <action-select-install-location
                        style="z-index: 999"
                        installationState=${this.installationState}
                        installationBootMedia=${this.installationBootMedia}
                        ?renderReady=${this.hasLoaded}
                      ></action-select-install-location>
                    `
                  : nothing}
              </main>
            </div>
          `
        : nothing}
      ${guard(
        [this.context.store.setupContext.view],
        () => html`
          <sl-dialog
            id="MgmtDialog"
            no-header
            ?open=${this.context.store.setupContext.view !== null}
          >
            ${choose(store.setupContext.view, [
              [
                "network",
                () => html`
                  <x-action-select-network
                    showSuccessAlert
                    .onClose=${() => this._closeMgmtDialog()}
                  >
                  </x-action-select-network>
                `,
              ],
              [
                "password",
                () =>
                  html` <x-action-change-pass
                    resetMethod="credentials"
                    showSuccessAlert
                    refreshAfterChange
                  ></x-action-change-pass>`,
              ],
              [
                "reboot",
                () => html`
                  <x-confirmation-prompt
                    title="Are you sure you want to reboot?"
                    description="Remove your USB recovery stick if you want to boot back into normal mode"
                    bottomButtonText="Cancel"
                    .bottomButtonClick=${this._closeMgmtDialog}
                    topButtonText="Reboot"
                    .topButtonClick=${this.triggerReboot}
                  ></x-confirmation-prompt>
                `,
              ],
              [
                "post-reboot",
                () =>
                  html` <img style="width: 100%;" src="/static/img/again.png" />
                    <p class="statement">
                      Rebooting.<br /><small
                        >Please re-reconnect to the same network as your Dogebox
                        and refresh.</small
                      >
                    </p>`,
              ],
              [
                "power-off",
                () => html`
                  <x-confirmation-prompt
                    title="Are you sure you want to power off?"
                    description="Physical access may be required to turn your Dogebox on again"
                    bottomButtonText="Cancel"
                    .bottomButtonClick=${this._closeMgmtDialog}
                    topButtonText="Yes, turn it off."
                    .topButtonClick=${this.triggerPoweroff}
                  ></x-confirmation-prompt>
                `,
              ],
              [
                "post-power-off",
                () => html`
                  <img style="width: 100%;" src="/static/img/bye.png" />
                  <p class="statement">
                    Dogebox turned off successfully.<br />You may close this
                    page.
                  </p>
                `,
              ],
              [
                "factory-reset",
                () =>
                  html` <div class="coming-soon">
                    <h3>Not yet implemented</h3>
                  </div>`,
              ],
            ])}
            ${this.context.store.setupContext.hideViewClose
              ? nothing
              : html`
                  <sl-button
                    slot="footer"
                    outline
                    @click=${this._closeMgmtDialog}
                    >Close</sl-button
                  >
                `}
          </sl-dialog>
        `,
      )}
      <x-debug-panel></x-debug-panel>
    `;
  }
}

customElements.define("apmode-app", AppModeApp);
