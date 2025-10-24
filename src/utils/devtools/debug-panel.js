import {
  LitElement,
  html,
  css,
  classMap,
} from "/vendor/@lit/all@3.1.2/lit-all.min.js";

import { hookManager } from "/api/hooks.js";
import { bindToClass } from "/utils/class-bind.js";
import * as devToolFunctions from "./functions/index.js";
import "./debug-settings.js";
import { checkPupUpdates } from '/api/pup-updates/pup-updates.js';

class DebugPanel extends LitElement {
  static properties = {
    isVisible: { type: Boolean },
    _hook_bump_version: { type: Boolean },
  };

  static styles = css`
    :host {
      display: block;
      position: fixed;
      bottom: 0px;
      width: 100%;
      z-index: 99999;
    }
    .hidden {
      display: none;
    }
    .log-container {
      position: relative;
      max-height: 140px;
      overflow-y: scroll;
      background: rgba(0, 0, 0, 0.9);
      box-sizing: border-box;
      padding: 15px;
    }
    .entry {
      margin-bottom: 2px;
      font-size: var(--sl-font-size-x-small);
      font-weight: var(--sl-font-weight-normal);
    }
    .text {
      padding: 1px 4px;
      box-sizing: border-box;
      background: rgba(255, 255, 255, 0.15);
      display: inline-block;
    }
    .log {
      border-left: 2px solid lightgreen;
    }
    .error {
      border-left: 2px solid salmon;
    }
    .info {
      border-left: 2px solid skyblue;
    }

    .floating-controls-container {
      background: rgba(0, 0, 0, 1);
      padding: 8px;
      display: flex;
      justify-content: space-between;
    }
  `;

  constructor() {
    super();
    bindToClass(devToolFunctions, this)
    this.isVisible = false;
    this.logMessages = [];
    // this.originalConsoleLog = console.log;
    // this.originalConsoleInfo = console.info;
    // this.originalConsoleError = console.error;

    // console.log = (...args) => {
    //   this.logMessages.push({ type: 'log', args });
    //   this.originalConsoleLog(...args);
    //   this.requestUpdate();
    // };

    // console.info = (...args) => {
    //   this.logMessages.push({ type: 'info', args });
    //   this.originalConsoleInfo(...args);
    //   this.requestUpdate();
    // };

    // console.error = (...args) => {
    //   this.logMessages.push({ type: 'error', args });
    //   this.originalConsoleError(...args);
    //   this.requestUpdate();
    // }
  }

  firstUpdated() {
    // console.info('Log UI loaded.');
  }

  connectedCallback() {
    super.connectedCallback();
    document.addEventListener("keydown", this.toggleVisibility);

    // Catch and log errors in custom logger ui & in browser console.
    window.onerror = (message, source, lineno, colno, error) => {
      this.logMessages.push({
        type: "error",
        args: [message, source, lineno, colno, error],
      });
      this.requestUpdate();
    };
  }

  disconnectedCallback() {
    document.removeEventListener("keydown", this.toggleVisibility);
    super.disconnectedCallback();
  }

  toggleVisibility = (event, force) => {
    if (!event && force === "close") {
      this.isVisible = false;
    }
    if (!event && force === "open") {
      this.isVisible = true;
    }
    if (!force && event.ctrlKey && event.key === "l") {
      this.isVisible = !this.isVisible;
    }
  };

  showSettingsDialog() {
    this.shadowRoot.querySelector("debug-settings-dialog").openDialog();
  }

  handleBumpVersionToggle() {
    const newState = !this._hook_bump_version;
    this._hook_bump_version = newState;
    hookManager.set('bump-version', newState);
  }

  async handleCheckPupUpdates() {
    try {
      const result = await checkPupUpdates('all');
      const alert = Object.assign(document.createElement('sl-alert'), {
        variant: 'success',
        duration: 3000,
        closable: true
      });
      alert.innerHTML = `
        <sl-icon slot="icon" name="check-circle"></sl-icon>
        Update check initiated! Job ID: ${result.jobId || 'N/A'}
      `;
      document.body.appendChild(alert);
      alert.toast();
    } catch (error) {
      console.error('Failed to check for updates:', error);
      const alert = Object.assign(document.createElement('sl-alert'), {
        variant: 'danger',
        duration: 5000,
        closable: true
      });
      alert.innerHTML = `
        <sl-icon slot="icon" name="exclamation-triangle"></sl-icon>
        Failed to check for updates: ${error.message}
      `;
      document.body.appendChild(alert);
      alert.toast();
    }
  }

  render() {
    const classes = {
      "debugger-container": true,
      hidden: !this.isVisible,
    };
    return html`
      <div class=${classMap(classes)}>
        <div class="log-container hidden">
          ${this.logMessages.map((entry) => {
            return html`
              <div class="entry ${entry.type}">
                <div class="text">${entry.args.join(" ")}</div>
              </div>
            `;
          })}
        </div>
        <div class="floating-controls-container">
          <div class="left"></div>
          <div class="right">

            <sl-button variant="text"  size="small" @click=${() => this.toggleVisibility(null, "close")}>
              Hide
            </sl-button>

            <sl-dropdown hoist>
              <sl-button slot="trigger" size="small" caret>Dev Tools</sl-button>
              <sl-menu>
                <sl-menu-item>
                  Commands
                  <sl-menu slot="submenu">
                    <sl-menu-label>Response Hooks</sl-menu-label>
                    <sl-menu-item type="checkbox" ?checked=${this._hook_bump_version} @click=${this.handleBumpVersionToggle}>Bump version</sl-menu-item>
                    <sl-divider></sl-divider>
                    <sl-menu-label>Synethic Events</sl-menu-label>
                    <sl-menu-item @click=${this.emitSyntheticSystemProgress}>System Progress</sl-menu-item>
                    <sl-menu-item @click=${this.emitSyntheticUpdateAvailable}>Update Available</sl-menu-item>
                    <sl-divider></sl-divider>
                    <sl-menu-label>Pup Upgrades</sl-menu-label>
                    <sl-menu-item @click=${this.handleCheckPupUpdates}>Check for Updates</sl-menu-item>
                  </sl-menu>
                </sl-menu-item>
                <sl-menu-item @click=${this.showSettingsDialog}>Open Config</sl-menu-item>
              </sl-menu>
            </sl-dropdown>

          </div>
        </div>

        <debug-settings-dialog></debug-settings-dialog>
      </div>
    `;
  }

  // Disconnect custom methods when element is removed to avoid memory leaks
  disconnectedCallback() {
    super.disconnectedCallback();
    // console.log = this.originalConsoleLog;
    // console.info = this.originalConsoleInfo;
    // console.error = this.originalConsoleError;
  }
}

customElements.define("x-debug-panel", DebugPanel);
