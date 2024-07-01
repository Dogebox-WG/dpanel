import {
  LitElement,
  html,
  nothing,
  classMap,
  choose,
} from "/vendor/@lit/all@3.1.2/lit-all.min.js";

// Add shoelace once. Use components anywhere.
import { setBasePath } from "/vendor/@shoelace/cdn@2.14.0/utilities/base-path.js";
import "/vendor/@shoelace/cdn@2.14.0/shoelace.js";

// Import stylesheets
import { appModeStyles } from "/components/views/apmode-view/styles.js";
import { navStyles } from "./renders/nav.js";

// Views
import "/components/views/apmode-view/view-ap-login.js";
import "/components/views/login-view/login-view.js";
import "/components/views/change-pass-view/change-pass-view.js";
import "/components/views/create-key/create-key.js";
import "/components/views/select-network-view/select-network-view.js";

// Components
import "/components/common/dynamic-form/dynamic-form.js";

// Render chunks
import * as renderChunks from "./renders/index.js";

// Store
import { store } from "/state/store.js";

// Utils
import { bindToClass } from "/utils/class-bind.js";

// APIS
import { getSetupBootstrap } from "/api/setup/get-bootstrap.js";

// Do this once to set the location of shoelace assets (icons etc..)
setBasePath("/vendor/@shoelace/cdn@2.14.0/");

class AppModeApp extends LitElement {
  static styles = [appModeStyles, navStyles];
  static properties = {
    loading: { type: Boolean },
    isLoggedIn: { type: Boolean },
    activeStepNumber: { type: Number },
    setupState: { type: Object },
  };

  constructor() {
    super();
    this.dialog = null;
    this.isLoggedIn = false;
    this.activeStepNumber = 0;
    this.setupState = null;
    bindToClass(renderChunks, this);
  }

  set setupState(newValue) {
    this._setupState = newValue;
    if (newValue) {
      const stepNumber = this._determineStartingStep(newValue);
      console.log("stepNumber", stepNumber);
      this.activeStepNumber = stepNumber;
    }
  }

  get setupState() {
    return this._setupState;
  }

  connectedCallback() {
    super.connectedCallback();
    this.isLoggedIn = store.networkContext.token;
  }

  async fetchSetupState() {
    this.loading = true;
    const response = await getSetupBootstrap();
    if (response.setup) {
      this.setupState = response.setup;
    }
    // TODO (error handling)
    this.loading = false;
  }

  _determineStartingStep(setupState) {
    const { isLoggedIn, hasPassword, hasKey, hasConnection } = setupState;
    if (!isLoggedIn || !this.isLoggedIn) return 0;
    if (!hasPassword) return 1;
    if (hasPassword && !hasKey) return 2;
    if (hasPassword && hasKey && !hasConnection) return 3;
    return 4;
  }

  firstUpdated() {
    this.fetchSetupState();

    // Prevent dialog closures on overlay click
    this.dialog = this.shadowRoot.querySelector("#ChangePassDialog");
    this.dialog.addEventListener("sl-request-close", (event) => {
      if (event.detail.source === "overlay") {
        event.preventDefault();
      }
    });
  }

  _nextStep = () => {
    this.activeStepNumber++;
  };

  disconnectedCallback() {
    super.disconnectedCallback();
  }

  performLogout() {
    store.updateState({ networkContext: { token: null } });
    window.location.reload();
  }

  showResetPassDialog() {
    this.dialog.show();
  }

  render() {
    const navClasses = classMap({
      solid: this.isLoggedIn,
    });
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
              <nav class="${navClasses}">${this.renderNav()}</nav>
              <main id="Main">
                <div class="main-step-wrapper">
                  ${choose(
                    this.activeStepNumber,
                    [
                      [
                        0,
                        () =>
                          html`<view-ap-login
                            .onForgotPass=${() => this.showResetPassDialog()}
                          ></view-ap-login>`,
                      ],
                      [
                        1,
                        () =>
                          html`<change-pass-view
                            label="Secure your Dogebox"
                            description="Set your admin password.  This is also used in generating your Dogebox master key."
                            resetMethod="token"
                            .onSuccess=${this._nextStep}
                          ></change-pass-view>`,
                      ],
                      [
                        2,
                        () =>
                          html`<create-key
                            .onSuccess=${this._nextStep}
                          ></create-key>`,
                      ],
                      [
                        3,
                        () =>
                          html`<select-network-view
                            .onSuccess=${this._nextStep}
                          ></select-network-view>`,
                      ],
                      [
                        4,
                        () =>
                          html`<h1>Congrats</h1>
                            <br /><br />
                            <p>Confetti and stuff. Initial setup complete</p>`,
                      ],
                    ],
                    () => html`<h1>Error</h1>`,
                  )}
                </div>
              </main>
            </div>
          `
        : nothing}

      <sl-dialog id="ChangePassDialog">
        <change-pass-view
          resetMethod="credentials"
          .fieldDefaults=${{ resetMethod: this.isLoggedIn ? 0 : 1 }}
        ></change-pass-view>
      </sl-dialog>
    `;
  }
}

customElements.define("apmode-app", AppModeApp);
