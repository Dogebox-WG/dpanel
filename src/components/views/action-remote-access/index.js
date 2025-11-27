import {
  LitElement,
  html,
  css,
  nothing,
} from "/vendor/@lit/all@3.1.2/lit-all.min.js";

import {
  getSSHPublicKeys,
  deleteSSHPublicKey,
  addSSHPublicKey,
  getSSHState,
  setSSHState,
} from "/api/sshkeys/sshkeys.js";
import "/components/common/action-row/action-row.js";
import { asyncTimeout } from "/utils/timeout.js";
import { createAlert } from "/components/common/alert.js";

export class RemoteAccessSettings extends LitElement {
  static get properties() {
    return {
      _loading: { type: Boolean},
      _inflight: { type: Boolean },
      _server_fault: { type: String },
      _ssh_public_keys: { type: Array },
      _expanded_key: { type: String },
      _show_add_key_dialog: { type: Boolean },
      _selected_key_id_for_trash: { type: String },
      _show_private_key_warning: { type: Boolean },
      _new_key_value: { type: String },
      _ssh_state: { type: Object },
    }
  }

  static styles = css`
    h1 {
      display: block;
      font-family: "Comic Neue", sans-serif;
      text-align: center;
      margin-bottom: .4rem;
    }

    p {
      text-align: center;
      line-height: 1.4;
    }

    .helper-text {
      font-size: 0.8rem;
      color: #555555;
      font-family: 'Comic Neue';
      margin-bottom: 0.5em;
      text-align: center;
    }

    .actions {
      display: flex;
      flex-direction: row;
      justify-content: space-between;
      align-items: center;
      margin-top: 1em;

      sl-button {
        margin-right: -1em;
      }
    }

    .key-reveal-dropdown {
      font-size: 0.8rem;
      background: rgba(0,0,0,0.2);
      word-break: break-all;
      margin-left: 48px;
      padding: 1em;
      border-radius: 8px;
    }

    .key-actions {
      margin-left: 48px;
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: flex-end;
    }

    .form-control {
      display: flex;
      flex-direction: row;
      justify-content: flex-start;
      margin: 1em 0em;
    }

    .loading-list, .empty-list {
      height: 180px;
      display: flex;
      flex-direction: row;
      justify-content: center;
      align-items: center;
      color: #555555;
      font-family: 'Comic Neue';
    }

    .confirmation-container {
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: center;
      gap: 1em;
    }

  `

  constructor() {
    super();
    this._ssh_public_keys = [];
    this._expanded_key = "";
    this._server_fault = "";
    this._new_key_value = "";
    this._ssh_state = {};
  }

  firstUpdated() {
    this.fetchSSHState();
    this.fetchSSHPublicKeys();
  }

  async fetchSSHState() {
    this._inflight_state_fetch = true;
    try {
      const res = await getSSHState();
      if (res) {
        this._ssh_state = res;
      }
    } catch (err) {
      createAlert('warning', 'Failed to fetch SSH state');
    } finally {
      this._inflight_state_fetch = false;
    }
  }

  async fetchSSHPublicKeys() {
    // spinner start
    this._loading = true;

    await asyncTimeout(1000);

    try {
      const res = await getSSHPublicKeys();
      if (res.keys) {
        this._ssh_public_keys = res.keys
      }
    } catch (err) {
      // failed to fetch keys
      this._server_fault = err.message;
      console.log('ER', err);
    } finally {
      this._loading = false;
    }
  }

  handleExpand(keyId) {
    this._expanded_key = keyId
  }

  handleAddClick() {
    this._show_add_key_dialog = true
  }

  handleTrash(keyId) {
    this._selected_key_id_for_trash = keyId;
  }

  async performAddKey() {
    this._inflight = true;
    await asyncTimeout(1000);
    try {
      const res = await addSSHPublicKey(this._new_key_value.trim())
      await asyncTimeout(2000);
      this._inflight = false;
      this._show_add_key_dialog = false;
      this._new_key_value = "";
    } catch (err) {
      createAlert('danger', 'Failed to add SSH key');
    } finally {
      this.fetchSSHPublicKeys();
    }
  }

  async performKeyDelete() {
    this._inflight = true;
    await asyncTimeout(1000);
    try {
      const res = await deleteSSHPublicKey(this._selected_key_id_for_trash)
      await asyncTimeout(2000);
      this._selected_key_id_for_trash = "";
      this._inflight = false;
    } catch (err) {
      createAlert('danger', 'Failed to delete SSH key');
    } finally {
      this.fetchSSHPublicKeys();
    }
  }

  handleTextareaInput(e) {
    const inputValue = e.target.value;
    this._new_key_value = inputValue;
    this._show_private_key_warning = privateKeyIndicators.some(indicator =>
      inputValue.includes(indicator)
    );
  }

  async handleSSHToggle(e) {
    try {
      await setSSHState({ enabled: e.target.checked });
    } catch (err) {
      createAlert('danger', 'Failed to change SSH state');
    }
  }

  render() {
    const hasKeys = this._ssh_public_keys.length
    const keys = this._ssh_public_keys 
    return html`
      <h1>Remote Access</h1>

      <div class="helper-text">
        <pre>ssh shibe@${window.location.hostname}</pre>
      </div>

      <div class="form-control">
        <sl-switch @sl-change=${this.handleSSHToggle} ?checked=${this._ssh_state.enabled} help-text="Allows your Dogebox to be accessed via SSH.">Enable SSH Service</sl-switch>
      </div>
      
      <div class="actions">
        <strong>SSH keys</strong>
        <sl-button
          ?disabled=${this._loading || this._inflight}
          variant="text"
          class="pull-right"
          @click=${this.handleAddClick}>
          + Add key
        </sl-button>
      </div>

      ${this._loading ? html`
        <div class="loading-list">
          <sl-spinner style="--indicator-color:#777;"></sl-spinner>
        </div>
      ` : nothing }

      ${!hasKeys && !this._loading && !this._inflight ? html`
        <div class="empty-list">
          <p>No keys here.</p>
        </div>
      ` : nothing }

      <div class="list">
      ${!this._loading && hasKeys ? keys.map((k) => {
        return html`
        <action-row
          expandable
          ?expand=${this._expanded_key === k.id}
          @row-expand=${() => this.handleExpand(k.id)}
          prefix="key"
          label="${k.key.substring(0, 32)}..."
        >
          Added: <sl-format-date month="long" day="numeric" year="numeric" date="${k.dateAdded}"></sl-format-date>
          <div slot="hidden">
            <div class="key-reveal-dropdown">${k.key}</div>
            <div class="key-actions">
              <sl-copy-button hoist value=${k.key}></sl-copy-button>
              <sl-icon-button name="trash-fill" label="Trash" @click=${() => this.handleTrash(k.id)}></sl-icon-button>
            </div>
          </div>
        </action-row>`
      }) : nothing }
      </div>

      <sl-dialog @sl-request-close=${(e) => { this._selected_key_id_for_trash = ""; e.stopPropagation();}} ?open=${this._selected_key_id_for_trash} label="Are you sure?">
        <div class="confirmation-container">
          <sl-button variant="text" @click=${() => this._selected_key_id_for_trash = ""}>I changed my mind</sl-button>
          <sl-button variant="danger" ?loading=${this._inflight} @click=${this.performKeyDelete}>Yes, delete this SSH Public Key</sl-button>
        </div>
      </sl-dialog>

      <sl-dialog @sl-request-close=${(e) => { this._show_add_key_dialog = false; e.stopPropagation(); }} ?open=${this._show_add_key_dialog} label="Add an SSH Public Key">
        <sl-textarea
          value=${this._new_key_value}
          rows="6"
          help-text="Important: Enter your public key"
          @sl-input=${this.handleTextareaInput}
          >
        </sl-textarea>

        <sl-alert variant="warning" ?open=${this._show_private_key_warning} style="margin-top: 1em;">
          Take care, you may have mistakenly entered a Private key.<br>Be sure to enter a Public key only.
        </sl-alert>

        <div slot="footer">
          <sl-button variant="text" @click=${() => this._show_add_key_dialog = false}>I've changed my mind</sl-button>
          <sl-button variant="primary" ?disabled=${this._inflight || this._show_private_key_warning || !this._new_key_value} ?loading=${this._inflight} @click=${this.performAddKey}>Submit</sl-button>
        </div>
      </sl-dialog>
    `
  }
}

const privateKeyIndicators = [
  '-----BEGIN PRIVATE KEY-----',
  '-----BEGIN RSA PRIVATE KEY-----',
  '-----BEGIN OPENSSH PRIVATE KEY-----',
  '-----BEGIN EC PRIVATE KEY-----',
  '-----BEGIN DSA PRIVATE KEY-----'
];

customElements.define('x-action-remote-access', RemoteAccessSettings);