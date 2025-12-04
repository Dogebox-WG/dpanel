import {
  LitElement,
  html,
  css,
  classMap,
  nothing
} from "/vendor/@lit/all@3.1.2/lit-all.min.js";
import { StoreSubscriber } from "/state/subscribe.js";
import { store } from "/state/store.js";
import { mocks } from "/api/mocks.js";
import { getMockConfig, saveMockConfig, resetMockConfig } from "/api/pup-updates/pup-updates.mocks.js";

class DebugSettingsDialog extends LitElement {
  static properties = {
    isOpen: { type: Boolean },
    _pupUpdateConfig: { type: Object },
    _newVersionInput: { type: String },
  };

  constructor() {
    super();

    // Subscribe to store
    this.context = new StoreSubscriber(this, store);
    this.isOpen = false;
    // this.mockOptions = [
    //   { enabled: true, group: 'networks', name: '/networks', method: 'GET' },
    //   { enabled: true, group: 'networks', name: '/networks/save', method: 'POST' },
    //   { enabled: true, group: 'keys', name: '/key/list', method: 'GET' },
    //   { enabled: "", group: 'keys', name: '/keys/create', method: 'POST' }
    // ]

    this.mockOptions = mocks;
    this._pupUpdateConfig = getMockConfig();
    this._newVersionInput = '';
  }

  get groupedOptions() {
    return this.mockOptions.reduce((acc, option) => {
      if (!acc[option.group]) {
        acc[option.group] = [];
      }
      acc[option.group].push(option);
      return acc;
    }, {});
  }

  static styles = css`
    .form-control {
      margin-bottom: 1.5em;
      position: relative;
    }

    .extras {
      position: absolute;
      top: -8px;
      right: -8px;
    }

    .expandable {
      margin-top: 8px;
    }

    .expandable .inner {
      background: #141414;
      padding: 0.5em;
      max-height: 400px;
      overflow-y: scroll;
    }

    .expandable.disabled {
      opacity: 0.5;
    }

    .expandable.hidden {
      display: none;
    }

    .mock-group-wrap {
      margin-bottom: 1em;
      h4 {
        margin: 0px;
        padding: 0px;
        text-transform: uppercase;
        font-family: 'Comic Neue';
        font-weight: 600;
        font-size: 0.8rem;
        border-bottom: 1px solid #444;
        margin-bottom: 4px;
      }
    }
  `;

  connectedCallback() {
    super.connectedCallback();

    // Prevent the dialog from closing when the user clicks on the overlay
    const dialog = this.shadowRoot.querySelector(".dialog-deny-close");
    this.addEventListener("sl-request-close", this.denyClose);
  }

  handleToggle(event) {
    const changes = { networkContext: {} };
    changes.networkContext[event.target.name] = event.target.checked;
    store.updateState(changes);
  }

  handleInput(event) {
    const changes = { networkContext: {} };
    changes.networkContext[event.target.name] = event.target.value;
    store.updateState(changes);
  }

  handleMockToggle(event) {
    const changes = { networkContext: {} };
    const uniqueMockID = `mock::${event.target.getAttribute('group')}::${event.target.getAttribute('name')}::${event.target.getAttribute('method')}`
    changes.networkContext[uniqueMockID] = event.target.checked;
    store.updateState(changes);
  }

  toggleExpandable() {
    this.shadowRoot.querySelector('.expandable').classList.toggle('hidden');
  }

  // Pup Updates Mock Config handlers
  handlePupUpdateConfigChange(field, value) {
    this._pupUpdateConfig = { ...this._pupUpdateConfig, [field]: value };
    saveMockConfig(this._pupUpdateConfig);
  }

  handleAddVersion() {
    if (!this._newVersionInput.trim()) return;
    
    const newVersion = {
      version: this._newVersionInput.trim(),
      releaseNotes: `## Version ${this._newVersionInput.trim()}\n\nRelease notes here...`,
      releaseDate: new Date().toISOString().split('T')[0]
    };
    
    const versions = [...(this._pupUpdateConfig.availableVersions || []), newVersion];
    // Sort descending by version
    versions.sort((a, b) => b.version.localeCompare(a.version, undefined, { numeric: true }));
    
    this._pupUpdateConfig = { ...this._pupUpdateConfig, availableVersions: versions };
    saveMockConfig(this._pupUpdateConfig);
    this._newVersionInput = '';
  }

  handleRemoveVersion(version) {
    const versions = this._pupUpdateConfig.availableVersions.filter(v => v.version !== version);
    this._pupUpdateConfig = { ...this._pupUpdateConfig, availableVersions: versions };
    saveMockConfig(this._pupUpdateConfig);
  }

  handleResetPupUpdateConfig() {
    resetMockConfig();
    this._pupUpdateConfig = getMockConfig();
  }

  render() {
    const { networkContext, appContext } = this.context.store;
    return html`
      <sl-dialog ?open=${this.isOpen} class="dialog-deny-close" no-header>
        <form @submit=${this.handleSubmit}>
          <div class="form-control">
            <sl-switch
              name="useMocks"
              help-text="When enabled, ApiClient returns mocked successful responses"
              .checked=${networkContext.useMocks}
              @sl-change=${this.handleToggle}>
                Network Mocks
            </sl-switch>
            <sl-button variant="text" class="extras" @click=${this.toggleExpandable}>Show/Hide Mocks</sl-button>

            <div class="expandable ${networkContext.useMocks ? "" : "disabled"}">
              <div class="inner">
                ${Object.keys(this.groupedOptions).map(group => html`
                  <div class="mock-group-wrap">
                    <h4>${group}</h4>
                    ${this.groupedOptions[group].map(option => html`
                      <x-mock-option
                        name=${option.name}
                        method=${option.method}
                        group=${option.group}
                        ?disabled=${!networkContext.useMocks}
                        ?checked=${networkContext[`mock::${option.group}::${option.name}::${option.method}`]}
                        .onChange=${this.handleMockToggle}
                      ></x-mock-option>
                    `)}
                  </div>
                `)}
                
                <!-- Pup Updates Mock Config -->
                <div class="mock-group-wrap">
                  <h4>Pup Updates</h4>
                  <div style="padding: 0.5em 0;">
                    <div style="margin-bottom: 0.75em;">
                      <sl-input
                        label="Current Version"
                        size="small"
                        value=${this._pupUpdateConfig.currentVersion}
                        ?disabled=${!networkContext.useMocks}
                        @sl-change=${(e) => this.handlePupUpdateConfigChange('currentVersion', e.target.value)}
                      ></sl-input>
                    </div>
                    
                    <div style="margin-bottom: 0.75em;">
                      <sl-input
                        label="Latest Version"
                        size="small"
                        value=${this._pupUpdateConfig.latestVersion}
                        ?disabled=${!networkContext.useMocks}
                        @sl-change=${(e) => this.handlePupUpdateConfigChange('latestVersion', e.target.value)}
                      ></sl-input>
                    </div>
                    
                    <div style="margin-bottom: 0.75em;">
                      <sl-switch
                        size="small"
                        ?checked=${this._pupUpdateConfig.updateAvailable}
                        ?disabled=${!networkContext.useMocks}
                        @sl-change=${(e) => this.handlePupUpdateConfigChange('updateAvailable', e.target.checked)}
                      >Update Available</sl-switch>
                    </div>
                    
                    <div style="margin-bottom: 0.5em;">
                      <strong style="font-size: 0.8rem; color: #888;">Available Versions:</strong>
                    </div>
                    
                    <div style="margin-bottom: 0.75em; max-height: 100px; overflow-y: auto; background: #1a1a1a; padding: 0.5em; border-radius: 4px;">
                      ${this._pupUpdateConfig.availableVersions?.length ? this._pupUpdateConfig.availableVersions.map(v => html`
                        <div style="display: flex; align-items: center; justify-content: space-between; padding: 2px 0; border-bottom: 1px solid #333;">
                          <span style="font-family: monospace; font-size: 0.8rem;">${v.version}</span>
                          <sl-icon-button 
                            name="x-lg" 
                            label="Remove"
                            style="font-size: 0.7rem;"
                            ?disabled=${!networkContext.useMocks}
                            @click=${() => this.handleRemoveVersion(v.version)}
                          ></sl-icon-button>
                        </div>
                      `) : html`<em style="color: #555; font-size: 0.8rem;">No versions</em>`}
                    </div>
                    
                    <div style="display: flex; gap: 0.5em; margin-bottom: 0.5em;">
                      <sl-input 
                        placeholder="e.g. 1.3.0" 
                        size="small"
                        style="flex: 1;"
                        value=${this._newVersionInput}
                        ?disabled=${!networkContext.useMocks}
                        @sl-input=${(e) => this._newVersionInput = e.target.value}
                        @keydown=${(e) => e.key === 'Enter' && this.handleAddVersion()}
                      ></sl-input>
                      <sl-button size="small" ?disabled=${!networkContext.useMocks} @click=${this.handleAddVersion}>Add</sl-button>
                    </div>
                    
                    <sl-button variant="text" size="small" ?disabled=${!networkContext.useMocks} @click=${this.handleResetPupUpdateConfig}>Reset</sl-button>
                  </div>
                </div>
              </div>
              <small>Important: Changes require <a href="" @click=${(e) => { e.preventDefault(); window.location.reload()}}>refresh</a> to kick in</small>
            </div>
          </div>

          <div class="form-control">
            <sl-switch
              name="forceFailures"
              help-text="When enabled, ApiClient returns failure responses"
              .checked=${networkContext.forceFailures}
              @sl-change=${this.handleToggle}>
                Force Network Failures
            </sl-switch>
          </div>

          <div class="form-control">
            <sl-switch
              name="reqLogs"
              help-text="When enabled, Requests and Responses are logged"
              .checked=${networkContext.reqLogs}
              @sl-change=${this.handleToggle}>
                Request/Response Logs
            </sl-switch>
          </div>

          <div class="form-control">
            <sl-switch
              name="logStateUpdates"
              help-text="When enabled, websocket STATE messages are logged"
              .checked=${networkContext.logStateUpdates}
              @sl-change=${this.handleToggle}>
                Log websocket STATE messages
            </sl-switch>
          </div>

          <div class="form-control">
            <sl-switch
              name="logStatsUpdates"
              help-text="When enabled, websocket STATS messages are logged"
              .checked=${networkContext.logStatsUpdates}
              @sl-change=${this.handleToggle}>
                Log websocket STATS messages
            </sl-switch>
          </div>

          <div class="form-control">
            <sl-switch
              name="logProgressUpdates"
              help-text="When enabled, websocket PROGRESS messages are logged"
              .checked=${networkContext.logProgressUpdates}
              @sl-change=${this.handleToggle}>
                Log websocket PROGRESS messages
            </sl-switch>
          </div>

          <div class="form-control">
            <sl-input
              type="number"
              name="forceDelayInSeconds"
              help-text="Mocks will wait [x] seconds before responding"
              value=${networkContext.forceDelayInSeconds}
              @sl-change=${this.handleInput}>
                Force Network Delay
            </sl-switch>
          </div>
          <div class="form-control">
            <sl-switch
              name="overrideBaseUrl"
              help-text="Force API calls to use base URL below"
              .checked=${networkContext.overrideBaseUrl}
              @sl-change=${this.handleToggle}>
                Override Base URL
            </sl-input>
          </div>
          <div class="form-control">
            <sl-input
              type="text"
              name="apiBaseUrl"
              help-text="API calls will use this base URL"
              value=${networkContext.apiBaseUrl}
              @sl-change=${this.handleInput}>
                API Base URL
            </sl-input>
          </div>
          <div class="form-control">
            <sl-switch
              name="overrideBaseUrl"
              help-text="Force API calls to use base URL below"
              .checked=${networkContext.overrideSocketBaseUrl}
              @sl-change=${this.handleToggle}>
                Override Web Socket Base URL
            </sl-input>
          </div>
          <div class="form-control">
            <sl-input
              type="text"
              name="wsApiBaseUrl"
              help-text="Web Socket connections will use this base URL"
              value=${networkContext.wsApiBaseUrl}
              @sl-change=${this.handleInput}>
                Web Socket Base URL
            </sl-input>
          </div>
          <div class="form-control">
            <sl-input
              type="text"
              name="demoSystemPrompt"
              help-text="Force Display of System Prompt"
              value=${networkContext.demoSystemPrompt}
              @sl-change=${this.handleInput}>
                Force Prompt by Name
            </sl-input>
          </div>

          <div class="form-control">
            <sl-input
              type="text"
              name="reflectorHost"
              help-text="Override reflector host"
              value="${networkContext.reflectorHost ?? "https://reflector.dogecoin.org"}"
              @sl-change=${this.handleInput}>
              Override reflector host
            </sl-input>
          </div>

          <div class="form-control">
            <sl-button variant="warning" @click=${() => store.updateState({ networkContext: { token: "invalid-token-here" }})}>Invalidate Auth Token</sl-buton>
          </div>
          <div class="form-control">
            <sl-button variant="danger" @click=${() => store.updateState({ networkContext: { token: false }})}>Clear Auth Token</sl-buton>
          </div>
        </form>
        <div slot="footer">
          <sl-button @click=${this.closeDialog}>Close</sl-button>
        </div>
      </sl-dialog>
    `;
  }

  disconnectedCallback() {
    dialog = this.shadowRoot.querySelector(".dialog-deny-close");
    dialog.removeEventListener("sl-request-close", this.denyClose);
    super.disconnectedCallback();
  }

  denyClose = (event) => {
    if (event.detail.source === "overlay") {
      event.preventDefault();
    }
  };

  handleSubmit(event) {
    // Prevent the form from submitting
    event.preventDefault();
  }

  openDialog() {
    this.isOpen = true;
    this.requestUpdate(); // Request an update to re-render the component with the dialog open
  }

  closeDialog() {
    this.isOpen = false;
    this.requestUpdate(); // Request an update to re-render the component with the dialog closed
  }

  saveSettings() {
    // Logic to save settings
    console.log("Settings saved!");
    this.closeDialog();
  }
}

customElements.define("debug-settings-dialog", DebugSettingsDialog);

class MockOption extends LitElement {
  static get properties() {
    return {
      name: { type: String },
      method: { type: String },
      group: { type: String },
      checked: { type: Boolean },
      disabled: { type: Boolean },
      onChange: { type: Object }
    }
  }
  constructor() {
    super()
    this.tagColors = {
      'get': 'primary',
      'post': 'success',
      'put': 'warning',
      'delete': 'danger'
    }
  }
  static styles = css`

    .wrap {
      display: flex;
      align-items: center;
      gap: 1em;
    }

    .option::part(label) {
      font-family: Monospace;
    }

    .method {
      position: relative;
      top: 1px;
      text-transform: uppercase;
    }
  `
  render() {
    const { name, group, method, checked, disabled } = this;
    return html`
      <div class="wrap">
        <sl-checkbox
          @sl-change=${this.onChange}
          group=${group}
          method=${method}
          name=${name}
          ?disabled=${disabled}
          ?checked=${checked}
          size="small"
          class="option">
            ${name}
        </sl-checkbox>
        ${method ? html `
        <sl-tag size="small" class="method" variant=${this.tagColors[method] || 'neutral'}>${method}</sl-tag>
        `: nothing }
      </div>
    `
  }
}
customElements.define("x-mock-option", MockOption);
