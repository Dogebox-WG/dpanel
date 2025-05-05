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
import "/components/views/action-select-install-location/index.js";
import "/components/views/action-system-settings/index.js";
import "/components/views/setup-dislaimer/index.js";
import "/components/views/confirmation-prompt/index.js";
import "/pages/page-recovery/index.js";
import "/components/views/action-select-install-pup-collection/index.js";

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
const STEP_INSTALL_PUP_COLLECTION = 6;
const STEP_DONE = 7;
const STEP_INSTALL = 8;

class AppModeApp extends LitElement {
  static styles = [appModeStyles, navStyles];
  static properties = {
    loading: { type: Boolean },
    isLoggedIn: { type: Boolean },
    activeStepNumber: { type: Number },
    setupState: { type: Object },
    isFirstTimeSetup: { type: Boolean },
    isForbidden: { type: Boolean },
    installationMode: { type: String },
    isInstalled: { type: Boolean },
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
    this.installationMode = "";
    this.isInstalled = false;
    this.hasLoaded = false;
    this.mainChannel = mainChannel;
    bindToClass(renderChunks, this);
    this.context = new StoreSubscriber(this, store);
    
  }

  set setupState(newValue) {
    this._setupState = newValue;
    if (newValue) {
      const stepNumber = this._determineStartingStep(newValue);
      this.activeStepNumber = stepNumber;
    }
  }

  get setupState() {
    return this._setupState;
  }

  connectedCallback() {
    super.connectedCallback();
    this.isLoggedIn = !!store.networkContext.token;

    // Instantiate a web socket connection and add main app as an observer
    this.mainChannel.addObserver(this);
  }

  async fetchSetupState() {
    this.loading = true;
    const response = await getSetupBootstrap({ noLogoutRedirect: true });

    if (!response.success && response.status === 401) {
      this.setupState = { isForbidden: true };
      this.loading = false;
      return;
    }

    if (!response.setupFacts) {
      // TODO (error handling)
      alert("Failed to fetch bootstrap.");
      return;
    }

    this.setupState = response.setupFacts;
    this.loading = false;
  }

  async fetchRecoveryState() {
    const response = await getRecoveryBootstrap({ noLogoutRedirect: true });

    if (!response.recoveryFacts) {
      // TODO (error handling)
      alert("Failed to fetch bootstrap.");
      return;
    }

    this.isInstalled = response.recoveryFacts.isInstalled ?? false;
    this.installationMode = response.recoveryFacts.installationMode ?? "";
    this.hasLoaded = true;
  }

  _determineStartingStep(setupState) {
    const {
      hasCompletedInitialConfiguration,
      hasGeneratedKey,
      hasConfiguredNetwork,
      hasSelectedPupCollection,
      isForbidden,
    } = setupState;

    // First check if we're forbidden
    if (isForbidden) {
      return STEP_LOGIN;
    }

    // Handle first-time setup
    if (!hasCompletedInitialConfiguration) {
      this.isFirstTimeSetup = true;
      return STEP_INTRO;
    }

    // If we're already fully set up, or if we've generated a key, show our login step.
    if (!this.isLoggedIn && (hasCompletedInitialConfiguration || hasGeneratedKey)) {
      return STEP_LOGIN;
    }

    // If we're logged in, follow the setup sequence
    if (this.isLoggedIn) {
      if (!hasGeneratedKey) {
        return STEP_GENERATE_KEY;
      }
      if (!hasConfiguredNetwork) {
        return STEP_NETWORK;
      }
      if (!hasSelectedPupCollection) {
        return STEP_INSTALL_PUP_COLLECTION;
      }
      return STEP_DONE;
    }

    // Default to login if none of the above conditions are met
    return STEP_LOGIN;
  }

  firstUpdated() {
    this.fetchSetupState();
    this.fetchRecoveryState();
    
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
    this.isLoggedIn = this.context.store.networkContext.token;
    this.activeStepNumber++;
  };

  disconnectedCallback() {
    this.mainChannel.removeObserver(this);
    super.disconnectedCallback();
  }

  performLogout(e) {
    if (!e.currentTarget.disabled) {
      store.updateState({ networkContext: { token: null } });
      window.location.reload();
    }
  }

  triggerReboot = async () => {
    try {
      instruction({
        img: '/static/img/again.png',
        text: 'Rebooted.',
        subtext: 'Please re-reconnect to the same network as your Dogebox and refresh.',
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
        img: '/static/img/bye.png',
        text: 'Dogebox turned off successfully.<br>You may close this page.',
        subtext: '',
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
                  () => this.renderNav(this.activeStepNumber > STEP_LOGIN && this.activeStepNumber < STEP_DONE),
                )}
              </nav>

              <main
                id="Main"
                style="padding-top: ${this.activeStepNumber > STEP_LOGIN && this.activeStepNumber < STEP_DONE ? "0px;" : "100px"}"
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
                            .onSuccess=${this._nextStep}
                          ></x-action-change-pass>`,
                      ],
                      [
                        STEP_GENERATE_KEY,
                        () =>
                          html`<x-action-create-key
                            .onSuccess=${this._nextStep}
                          ></x-action-create-key>`,
                      ],
                      [
                        STEP_NETWORK,
                        () =>
                          html`<x-action-select-network
                            .onSuccess=${async () => {
                              await asyncTimeout(750);
                              this._nextStep();
                            }}
                            .reflectorToken=${reflectorToken}
                          ></x-action-select-network>`,
                      ],
                      [
                        STEP_INSTALL_PUP_COLLECTION,
                        () =>
                          html`<x-action-select-install-pup-collection
                            .onSuccess=${this._nextStep}
                          ></x-action-select-install-pup-collection>`,
                      ],
                      [
                        STEP_DONE,
                        () =>
                          html`<x-page-recovery
                            .reflectorToken=${reflectorToken}
                            .isFirstTimeSetup=${this.isFirstTimeSetup}
                          ></x-page-recovery>`,
                      ],
                    ],
                    () => html`<h1>Error</h1>`,
                  )}
                </div>
                ${true
                  ? html`
                      <action-select-install-location
                        style="z-index: 999"
                        mode=${this.installationMode}
                        ?isInstalled=${this.isInstalled}
                        ?renderReady=${this.hasLoaded}
                        ?open=${["canInstall", "mustInstall"].includes(
                          this.installationMode,
                        )}
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
                  html`
                  <img style="width: 100%;" src="/static/img/again.png" />
                  <p class="statement">Rebooting.<br><small>Please re-reconnect to the same network as your Dogebox and refresh.</small></p>`,
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
                () =>
                  html`
                    <img style="width: 100%;" src="/static/img/bye.png" />
                    <p class="statement">Dogebox turned off successfully.<br>You may close this page.</p>
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
