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
import {
  getTailscaleState,
  setTailscaleState,
  setTailscaleConfig,
  getTailscaleStatus,
} from "/api/tailscale/tailscale.js";
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
      // Tailscale
      _tailscale_state: { type: Object },
      _tailscale_status: { type: Object },
      _tailscale_rebuilding: { type: Boolean },
      _tailscale_checking: { type: Boolean },
      _tailscale_auth_key: { type: String },
      _tailscale_hostname: { type: String },
      _tailscale_advertise_routes: { type: String },
      _tailscale_tags: { type: String },
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

    .section {
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 12px;
      padding: 1.25em;
      margin-bottom: 1.5em;
    }

    .section-header {
      display: flex;
      align-items: center;
      gap: 0.5em;
      margin-bottom: 0.75em;
    }

    .section-header sl-icon {
      font-size: 1.25rem;
      color: var(--sl-color-primary-500);
    }

    .section-header h2 {
      font-family: "Comic Neue", sans-serif;
      font-size: 1.1rem;
      margin: 0;
      font-weight: 600;
    }

    .section-description {
      font-size: 0.85rem;
      color: rgba(255,255,255,0.6);
      margin-bottom: 1em;
      line-height: 1.4;
    }

    .section-description a {
      color: var(--sl-color-primary-400);
      text-decoration: none;
    }

    .section-description a:hover {
      text-decoration: underline;
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
      height: 120px;
      display: flex;
      flex-direction: row;
      justify-content: center;
      align-items: center;
      color: rgba(255,255,255,0.4);
      font-family: 'Comic Neue';
    }

    .confirmation-container {
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: center;
      gap: 1em;
    }

    .tailscale-config {
      margin-top: 1em;
      padding: 1em;
      background: rgba(0,0,0,0.15);
      border-radius: 8px;
    }

    .tailscale-config sl-input,
    .tailscale-config sl-textarea {
      margin-bottom: 1em;
    }

    .tailscale-config .config-actions {
      display: flex;
      justify-content: flex-end;
      margin-top: 1em;
    }

    .tailscale-status {
      background: rgba(0,0,0,0.15);
      border-radius: 8px;
      padding: 1em;
      margin-bottom: 1em;
    }

    .tailscale-status-header {
      display: flex;
      align-items: center;
      gap: 0.5em;
      margin-bottom: 0.5em;
      font-weight: 600;
    }

    .tailscale-status-header sl-icon {
      font-size: 1.1rem;
    }

    .tailscale-status-header.connected sl-icon {
      color: var(--sl-color-success-500);
    }

    .tailscale-status-header.pending sl-icon {
      color: var(--sl-color-warning-500);
    }

    .tailscale-status-header.disconnected sl-icon {
      color: var(--sl-color-neutral-400);
    }

    .tailscale-status-details {
      font-size: 0.85rem;
      color: rgba(255,255,255,0.7);
    }

    .tailscale-status-details .detail-row {
      display: flex;
      justify-content: space-between;
      padding: 0.25em 0;
    }

    .tailscale-status-details .detail-label {
      color: rgba(255,255,255,0.5);
    }
  `

  constructor() {
    super();
    this._ssh_public_keys = [];
    this._expanded_key = "";
    this._server_fault = "";
    this._new_key_value = "";
    this._ssh_state = {};
    // Tailscale
    this._tailscale_state = {};
    this._tailscale_status = null;
    this._tailscale_rebuilding = false;
    this._tailscale_checking = true; // Start in checking state
    this._tailscale_auth_key = "";
    this._tailscale_hostname = "";
    this._tailscale_advertise_routes = "";
    this._tailscale_tags = "";
    this._pollInterval = null;
  }

  connectedCallback() {
    super.connectedCallback();
    // Reset to checking state when component reconnects
    this._tailscale_checking = true;
    this._tailscale_status = null;
    this._checkingAttempts = 0;
    
    this.fetchSSHState();
    this.fetchSSHPublicKeys();
    this.fetchTailscaleState();
    this.fetchTailscaleStatus();
    this.startPolling();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.stopPolling();
  }

  startPolling() {
    this.stopPolling();
    // Poll status every 3 seconds when component is visible
    this._pollInterval = setInterval(() => {
      if (this._tailscale_state.enabled) {
        this.fetchTailscaleStatus();
      }
    }, 3000);
  }

  stopPolling() {
    if (this._pollInterval) {
      clearInterval(this._pollInterval);
      this._pollInterval = null;
    }
  }

  async fetchSSHState() {
    try {
      const res = await getSSHState();
      if (res) {
        this._ssh_state = res;
      }
    } catch (err) {
      createAlert('warning', 'Failed to fetch SSH state');
    }
  }

  async fetchTailscaleState() {
    try {
      const res = await getTailscaleState();
      if (res) {
        this._tailscale_state = res;
        this._tailscale_hostname = res.hostname || "";
        this._tailscale_advertise_routes = res.advertiseRoutes || "";
        this._tailscale_tags = res.tags || "";
      }
    } catch (err) {
      createAlert('warning', 'Failed to fetch Tailscale state');
    }
  }

  async fetchTailscaleStatus() {
    try {
      const res = await getTailscaleStatus();
      if (res) {
        // Only update status and clear checking state if we got a real response
        // (not an error like "service not responding")
        const isRealStatus = res.backendState && !res.error;
        
        if (isRealStatus) {
          this._tailscale_status = res;
          this._tailscale_checking = false;
          this._tailscale_rebuilding = false;
          this._checkingAttempts = 0;
        } else if (this._tailscale_checking || this._tailscale_rebuilding) {
          // Still checking/rebuilding - increment attempts
          this._checkingAttempts = (this._checkingAttempts || 0) + 1;
          // After 10 attempts (30 seconds), give up and show the error
          if (this._checkingAttempts >= 10) {
            this._tailscale_status = res;
            this._tailscale_checking = false;
            this._tailscale_rebuilding = false;
          }
        } else {
          // Not in checking/rebuilding mode, show the status as-is
          this._tailscale_status = res;
        }
      }
    } catch (err) {
      console.log('Failed to fetch Tailscale status', err);
    }
  }

  async fetchSSHPublicKeys() {
    this._loading = true;
    await asyncTimeout(1000);
    try {
      const res = await getSSHPublicKeys();
      if (res.keys) {
        this._ssh_public_keys = res.keys
      }
    } catch (err) {
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
      await addSSHPublicKey(this._new_key_value.trim())
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
      await deleteSSHPublicKey(this._selected_key_id_for_trash)
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

  async handleTailscaleToggle(e) {
    const enabling = e.target.checked;
    this._tailscale_rebuilding = true;
    
    try {
      await setTailscaleState({ enabled: enabling });
      this._tailscale_state = { ...this._tailscale_state, enabled: enabling };
      createAlert('success', enabling ? 'Enabling Tailscale...' : 'Disabling Tailscale...');
    } catch (err) {
      createAlert('danger', 'Failed to change Tailscale state');
      this._tailscale_rebuilding = false;
    }
  }

  async handleTailscaleConfigSave() {
    this._tailscale_rebuilding = true;
    
    try {
      await setTailscaleConfig({
        authKey: this._tailscale_auth_key,
        hostname: this._tailscale_hostname,
        advertiseRoutes: this._tailscale_advertise_routes,
        tags: this._tailscale_tags,
      });
      createAlert('success', 'Tailscale configuration saved.');
      this._tailscale_auth_key = "";
      // Refresh state to get updated hasAuthKey
      await this.fetchTailscaleState();
    } catch (err) {
      createAlert('danger', 'Failed to save Tailscale configuration');
      this._tailscale_rebuilding = false;
    }
  }

  renderTailscaleStatus() {
    const status = this._tailscale_status;
    
    // Show rebuilding message if a rebuild is in progress
    if (this._tailscale_rebuilding) {
      return html`
        <div class="tailscale-status-header pending">
          <sl-spinner style="--indicator-color: var(--sl-color-warning-500); --track-width: 2px; font-size: 1rem;"></sl-spinner>
          <span>System rebuild in progress...</span>
        </div>
      `;
    }
    
    // Show checking message while waiting for first valid status
    if (this._tailscale_checking) {
      return html`
        <div class="tailscale-status-header pending">
          <sl-spinner style="--indicator-color: #777; --track-width: 2px; font-size: 1rem;"></sl-spinner>
          <span>Checking status...</span>
        </div>
      `;
    }
    
    // Show status based on backend state
    if (status?.backendState === 'Running') {
      return html`
        <div class="tailscale-status-header connected">
          <sl-icon name="check-circle-fill"></sl-icon>
          <span>Connected</span>
        </div>
        <div class="tailscale-status-details">
          ${status.tailscaleIP ? html`
            <div class="detail-row">
              <span class="detail-label">Tailscale IP</span>
              <span>${status.tailscaleIP}</span>
            </div>
          ` : nothing}
          ${status.hostname ? html`
            <div class="detail-row">
              <span class="detail-label">DNS Name</span>
              <span>${status.hostname}</span>
            </div>
          ` : nothing}
        </div>
      `;
    }
    
    if (status?.backendState === 'NeedsLogin') {
      return html`
        <div class="tailscale-status-header pending">
          <sl-icon name="exclamation-triangle-fill"></sl-icon>
          <span>Needs Authentication</span>
        </div>
        <div class="tailscale-status-details">
          Tailscale is running but not authenticated. Add or update your auth key below.
        </div>
      `;
    }
    
    if (status?.backendState === 'Starting') {
      return html`
        <div class="tailscale-status-header pending">
          <sl-spinner style="--indicator-color: var(--sl-color-warning-500); --track-width: 2px; font-size: 1rem;"></sl-spinner>
          <span>Starting...</span>
        </div>
      `;
    }
    
    // Not running or error
    if (status?.error || status?.backendState === 'NotRunning') {
      return html`
        <div class="tailscale-status-header disconnected">
          <sl-icon name="x-circle-fill"></sl-icon>
          <span>Not Running</span>
        </div>
        <div class="tailscale-status-details" style="color: var(--sl-color-danger-500);">
          ${status?.error || 'Tailscale service is not running.'}
        </div>
      `;
    }
    
    // No auth key configured
    if (!this._tailscale_state.hasAuthKey) {
      return html`
        <div class="tailscale-status-header disconnected">
          <sl-icon name="exclamation-circle"></sl-icon>
          <span>Needs Configuration</span>
        </div>
        <div class="tailscale-status-details" style="color: var(--sl-color-warning-500);">
          Add an auth key below to connect to your Tailscale network.
        </div>
      `;
    }
    
    // Loading/unknown state
    return html`
      <div class="tailscale-status-header pending">
        <sl-spinner style="--indicator-color: #777; --track-width: 2px; font-size: 1rem;"></sl-spinner>
        <span>Checking status...</span>
      </div>
    `;
  }

  render() {
    const hasKeys = this._ssh_public_keys.length
    const keys = this._ssh_public_keys 
    return html`
      <h1>Remote Access</h1>

      <!-- SSH Section -->
      <div class="section">
        <div class="section-header">
          <sl-icon name="terminal"></sl-icon>
          <h2>SSH Access</h2>
        </div>
        <div class="section-description">
          Securely access your Dogebox command line via SSH.<br>
          <code style="font-size: 0.9em; opacity: 0.8;">ssh shibe@${window.location.hostname}</code>
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
      </div>

      <!-- Tailscale Section -->
      <div class="section">
        <div class="section-header">
          <sl-icon name="globe2"></sl-icon>
          <h2>Tailscale VPN</h2>
        </div>
        <div class="section-description">
          Connect your Dogebox to your <a href="https://tailscale.com" target="_blank">Tailscale</a> network for secure remote access from anywhere.
        </div>

        <div class="form-control">
          <sl-switch 
            @sl-change=${this.handleTailscaleToggle} 
            ?checked=${this._tailscale_state.enabled}
            ?disabled=${this._tailscale_rebuilding}
            help-text="Enable Tailscale VPN service on your Dogebox.">
            Enable Tailscale
          </sl-switch>
        </div>

        ${this._tailscale_state.enabled ? html`
          <!-- Status Display -->
          <div class="tailscale-status">
            ${this.renderTailscaleStatus()}
          </div>

          <!-- Configuration Form -->
          <div class="tailscale-config">
            <sl-input
              label="Auth Key"
              type="password"
              placeholder="${this._tailscale_state.hasAuthKey ? '••••••••••••••••••••••••••••••••' : 'Enter auth key'}"
              help-text="${this._tailscale_state.hasAuthKey ? 'Auth key is configured. Enter a new key to replace it, or leave blank to keep.' : 'Generate a reusable auth key from your Tailscale admin console.'}"
              .value=${this._tailscale_auth_key}
              @sl-input=${(e) => this._tailscale_auth_key = e.target.value}
            ></sl-input>

            <sl-input
              label="Hostname"
              placeholder="${this._tailscale_state.effectiveHostname || 'dogebox'}"
              help-text="How this device will appear in your Tailscale network. Leave blank to use '${this._tailscale_state.effectiveHostname || 'dogebox'}'."
              .value=${this._tailscale_hostname}
              @sl-input=${(e) => this._tailscale_hostname = e.target.value}
            ></sl-input>

            <sl-input
              label="Advertise Routes (optional)"
              placeholder="10.0.0.0/24,192.168.1.0/24"
              help-text="Comma-separated list of routes to advertise to your Tailscale network."
              .value=${this._tailscale_advertise_routes}
              @sl-input=${(e) => this._tailscale_advertise_routes = e.target.value}
            ></sl-input>

            <sl-input
              label="Tags (optional)"
              placeholder="tag:server,tag:dogebox"
              help-text="Comma-separated ACL tags to apply to this device."
              .value=${this._tailscale_tags}
              @sl-input=${(e) => this._tailscale_tags = e.target.value}
            ></sl-input>

            <div class="config-actions">
              <sl-button 
                variant="primary" 
                ?loading=${this._tailscale_rebuilding}
                @click=${this.handleTailscaleConfigSave}>
                Save Configuration
              </sl-button>
            </div>
          </div>
        ` : nothing}
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
