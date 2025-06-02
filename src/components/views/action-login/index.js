import { LitElement, html, css, nothing } from "/vendor/@lit/all@3.1.2/lit-all.min.js";
import { postLogin } from "/api/login/login.js";
import { store } from "/state/store.js";
import { hash } from "/utils/hash.js";

// Components
import "/components/common/dynamic-form/dynamic-form.js";
import "/components/views/action-change-pass/index.js";

// Render chunks
import { renderBanner } from "./renders/banner.js";

class LoginView extends LitElement {
  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      margin-top: 4em;
    }
    .page {
      display: flex;
      flex-direction: column;
      align-self: center;
      justify-content: center;
    }
    h1 {
      font-family: "Comic Neue", sans-serif;
    }
    sl-alert {
      margin-bottom: 1em;
    }

    .padded {
      // background: #1a191f;
      // border: 1px solid rgb(32, 31, 36);
      border-radius: 16px;
      padding: 1em;
    }
  `;

  static get properties() {
    return {
      _server_fault: { type: Boolean },
      _invalid_creds: { type: Boolean },
      _loginFields: { type: Object },
      _attemptLogin: { type: Object },
      retainHash: { type: Boolean },
    };
  }

  constructor() {
    super();
    this._server_fault = false;
    this._invalid_creds = false;
    this.retainHash = false;
    this.dialog = null;
  }

  connectedCallback() {
    super.connectedCallback();
    this.addEventListener("sl-hide", this.dismissErrors);
    this._loginFields = {
      sections: [
        {
          name: "login",
          submitLabel: "Login",
          fields: [
            {
              name: "password",
              label: "Enter Password",
              type: "password",
              passwordToggle: true,
            },
          ],
        },
      ],
    };
  }

  firstUpdated() {
    // Prevent dialog closures on overlay click
    this.dialog = this.shadowRoot.querySelector("#ChangePassDialog");
    this.dialog.addEventListener("sl-request-close", (event) => {
      if (event.detail.source === "overlay") {
        event.preventDefault();
      }
    });
  }

  disconnectedCallback() {
    this.removeEventListener("sl-hide", this.dismissErrors);
    super.disconnectedCallback();
  }

  dismissErrors() {
    this._invalid_creds = false;
    this._server_fault = false;
  }

  _attemptLogin = async (data, form, dynamicFormInstance) => {
    // data.password = await hash(data.password); //TODO: Hash password
    data.password = data.password;
    
    const loginResponse = await postLogin(data).catch(this.handleFault);
    if (!loginResponse) {
      dynamicFormInstance.retainChanges(); // stops spinner
      return;
    }

    // Credential error
    if (loginResponse.error) {
      dynamicFormInstance.retainChanges(); // stops spinner
      this.handleError(loginResponse.error);
      return;
    }

    if (!loginResponse.token) {
      dynamicFormInstance.retainChanges(); // stops spinner
      this.handleError("MISSING-TOKEN");
      return;
    }

    // Credential success
    if (loginResponse.token) {
      dynamicFormInstance.retainChanges(); // stops spinner

      if (this.retainHash) {
        store.updateState({ setupContext: { hashedPassword: data.password }});
      }

      this.handleSuccess();
      return;
    }
  };

  handleFault = (loginFault) => {
    this._server_fault = true;
    console.warn(loginFault);
  };

  handleError(loginResponseError) {
    switch (loginResponseError) {
      case "CHECK-CREDS":
        this._invalid_creds = true;
        break;
      case "MISSING-TOKEN":
        this.handleFault({ error: loginResponseError });
        break;
      default:
        this.handleFault({ unhandledError: loginResponseError });
    }
  }

  handleSuccess() {
    window.location = "/";
  }

  handleForgotPass() {
    this.shadowRoot.querySelector("#ChangePassDialog").show();
  }

  render() {
    return html`
      <div class="page">
        <div class="padded">
          ${renderBanner()}
          <sl-alert variant="danger" ?open=${this._invalid_creds} closable>
            <sl-icon slot="icon" name="exclamation-triangle"></sl-icon>
            Incorrect password
          </sl-alert>

          <dynamic-form
            .fields=${this._loginFields}
            .onSubmit=${this._attemptLogin}
            requireCommit
            style="--submit-btn-width: 100%; --submit-btn-anchor: center;"
          >
          </dynamic-form>

          <sl-button variant="text" @click="${this.handleForgotPass}" style="margin-top: 1em;">
            I forgot my password
          </sl-button>
        </div>
      </div>

      <sl-dialog id="ChangePassDialog">
        <x-action-change-pass
          resetMethod="seedphrase"
          showSuccessAlert
          refreshAfterChange
          .fieldDefaults=${{ resetMethod: 0 }}
          label="Reset Password"
          description="Reset your password using your recovery phrase or current password"
        ></x-action-change-pass>
      </sl-dialog>
    `;
  }
}

customElements.define("x-action-login", LoginView);
