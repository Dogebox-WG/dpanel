import { LitElement, html, css } from "/vendor/@lit/all@3.1.2/lit-all.min.js";
import { postChangePass } from "/api/password/change-pass.js";
import { createAlert } from "/components/common/alert.js";
import { hash } from "/utils/hash.js"
import { asyncTimeout } from "/utils/timeout.js";

// Components
import "/components/common/dynamic-form/dynamic-form.js";

// Render chunks
import { renderBanner } from "./renders/banner.js";

// Store
import { store } from "/state/store.js";

class ChangePassView extends LitElement {
  static styles = css`
    :host {
      display: block;
    }
    .page {
      display: flex;
      align-self: center;
      justify-content: center;
      padding-bottom: 1em;
    }
    .padded {
      width: 100%;
      margin: 0em 0em;
    }
    h1 {
      font-family: "Comic Neue", sans-serif;
    }
  `;

  static get properties() {
    return {
      label: { type: String },
      buttonLabel: { type: String },
      description: { type: String },
      resetMethod: { type: String },
      fieldDefaults: { type: Object },
      showSuccessAlert: { type: Boolean },
      refreshAfterChange: { type: Boolean },
      retainHash: { type: Boolean },
      noSubmit: { type: Boolean },
      _server_fault: { type: Boolean },
      _invalid_creds: { type: Boolean },
    };
  }

  constructor() {
    super();
    this.label = "Reset Password";
    this.buttonLabel = "Update Password"
    this.description = "Change your admin password using your current pass or recovery phrase (12-words)";
    this.onSuccess = null;
    this.showSuccessAlert = false;
    this.refreshAfterChange = false;
    this.retainHash = false;
    this.noSubmit = false;
    this.fieldDefaults = {};
    this._server_fault = false;
    this._invalid_creds = false;
  }

  connectedCallback() {
    super.connectedCallback();
    this.addEventListener("sl-hide", this.dismissErrors);

    const changePassFields = {
      sections: [
        {
          name: "Change password",
          submitLabel: this.buttonLabel,
          fields: [
            {
              name: "new_password",
              label: "Enter New Password",
              type: "password",
              passwordToggle: true,
              requireConfirmation: true,
              required: true,
            },
          ],
        },
      ],
    };

    if (this.resetMethod === "credentials") {
      // Construct the field
      const resetByCredentialField = {
        name: "reset-method",
        type: "toggleField",
        defaultTo: this.fieldDefaults.resetMethod || 0,
        labels: ["Alternatively, enter recovery-phrase (12 words)", "Alternatively, enter current password"],
        fields: [
          {
            name: "password",
            label: "Enter Current Password",
            type: "password",
            passwordToggle: true,
            required: true,
          },
          {
            name: "seedphrase",
            label: "Enter Recovery Phrase (12-words)",
            type: "seedphrase",
            placeholder: "hungry tavern drumkit weekend dignified turmoil cucumber pants karate yacht treacle chump",
            required: true,
          },
        ]
      }
      
      // Prepend to field set
      changePassFields.sections[0].fields = [
        resetByCredentialField,
        ...changePassFields.sections[0].fields
      ]
    }
    this._changePassFields = changePassFields;
  }

  disconnectedCallback() {
    this.removeEventListener("sl-hide", this.dismissErrors);
    super.disconnectedCallback();
  }

  dismissErrors() {
    this._invalid_creds = false;
    this._server_fault = false;
  }

  _attemptChangePass = async (data, form, dynamicFormInstance) => {
    // Do a thing
    data.new_password = await hash(data.new_password);

    if (!this.noSubmit) {
      const response = await postChangePass(data).catch(this.handleFault);

      if (!response) {
        dynamicFormInstance.retainChanges(); // stops spinner
        return;
      }

      // Handle error
      if (response.error) {
        dynamicFormInstance.retainChanges(); // stops spinner
        this.handleError(response.error);
        return;
      }
    }

    // Success handling
    if (this.noSubmit) {
      await asyncTimeout(1000);
    }

    dynamicFormInstance.retainChanges(); // stops spinner
    if (this.retainHash) {
      store.updateState({ setupContext: { hashedPassword: data.new_password }});
    }

    await this.handleSuccess();
    return;
  };

  handleFault = (fault) => {
    this._server_fault = true;
    console.warn(fault);
  };

  handleError(err) {
    switch (err) {
      case "CHECK-CREDS":
        this._invalid_creds = true;
        break;
      default:
        this.handleFault({ unhandledError: err });
    }
  }

  handleSuccess = async () => {
    if (this.showSuccessAlert) {
      createAlert('success', 'Password updated.', 'check-square', 2000);
    }
    
    if (this.onSuccess) {
      this.onSuccess();
    }

    if (this.refreshAfterChange) {
      await asyncTimeout(2000);
      window.location.reload();
    }
  }

  render() {
    return html`
      <div class="page">
        <div class="padded">
          ${renderBanner(this.label, this.description)}
          <dynamic-form
            .fields=${this._changePassFields}
            .onSubmit=${this._attemptChangePass}
            requireCommit
            theme="purple"
          >
          </dynamic-form>
        </div>
      </div>
    `;
  }
}

customElements.define("change-pass-view", ChangePassView);
