import {
  LitElement,
  html,
  css,
  nothing,
} from "/vendor/@lit/all@3.1.2/lit-all.min.js";

import { store } from "/state/store.js";
import { StoreSubscriber } from "/state/subscribe.js";
import { pupUpdates } from "/state/pup-updates.js";
import { upgradePup } from "/api/pup-updates/pup-updates.js";
import { pkgController } from "/controllers/package/index.js";
import { createAlert } from "/components/common/alert.js";
import { compareVersions } from "/utils/version.js";
import "/components/common/version-selector/index.js";

/**
 * Pup Update Panel Component
 * Shows update details, version selector, release notes, and upgrade button
 */
class PupUpdatePanel extends LitElement {
  static get properties() {
    return {
      pupId: { type: String },
      pupName: { type: String },
      currentVersion: { type: String },
      _selectedVersion: { type: String },
      _isUpgrading: { type: Boolean },
      _error: { type: String },
    };
  }

  constructor() {
    super();
    this.context = new StoreSubscriber(this, store);
    this._selectedVersion = null;
    this._isUpgrading = false;
    this._error = null;
  }

  // Prevent sl-hide from bubbling up and closing the parent dialog
  // (This is the same pattern used in action-dependency-manage/dependency.js)
  firstUpdated() {
    this.addEventListener("sl-hide", this._handleHide);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener("sl-hide", this._handleHide);
  }

  _handleHide(e) {
    e.stopPropagation();
  }

  get updateInfo() {
    if (!this.pupId) return null;
    const { pupUpdatesContext } = this.context.store;
    return pupUpdatesContext.updateInfo[this.pupId] || null;
  }

  get availableVersions() {
    const info = this.updateInfo;
    if (!info || !info.availableVersions) return [];
    
    const currentVersion = this.currentVersion || info.currentVersion;
    
    // Filter to only versions higher than current, then sort by version descending (latest first)
    return [...info.availableVersions]
      .filter(v => this._compareVersions(v.version, currentVersion) > 0)
      .sort((a, b) => {
        return this._compareVersions(b.version, a.version);
      });
  }

  get selectedVersionInfo() {
    // Use explicitly selected version, or default to highest available (first in sorted list)
    const version = this._selectedVersion || this.availableVersions[0]?.version;
    return this.availableVersions.find(v => v.version === version) || null;
  }

  _compareVersions(a, b) {
    return compareVersions(a, b);
  }

  _handleVersionChange(e) {
    this._selectedVersion = e.detail.version;
  }

  async _handleUpgrade() {
    // Default to highest available version (first in sorted list)
    const targetVersion = this._selectedVersion || this.availableVersions[0]?.version;
    if (!targetVersion) return;

    this._isUpgrading = true;
    this._error = null;

    try {
      const result = await upgradePup(this.pupId, targetVersion);
      
      if (result.jobId) {
        createAlert('success', `Upgrade started for ${this.pupName}`, 'arrow-up-circle', 5000);
        
        // Dispatch event to close dialog
        this.dispatchEvent(new CustomEvent('upgrade-started', {
          detail: { jobId: result.jobId, targetVersion },
          bubbles: true,
          composed: true
        }));
      }
    } catch (error) {
      console.error('Upgrade failed:', error);
      this._error = error.message || 'Failed to start upgrade';
      createAlert('danger', `Upgrade failed: ${this._error}`, 'exclamation-triangle', 0);
    } finally {
      this._isUpgrading = false;
    }
  }

  async _handleSkip() {
    try {
      await pupUpdates.skipUpdate(this.pupId);
      createAlert('neutral', `Skipped updates for ${this.pupName}`, 'skip-forward', 3000);
      
      this.dispatchEvent(new CustomEvent('update-skipped', {
        detail: { pupId: this.pupId },
        bubbles: true,
        composed: true
      }));
    } catch (error) {
      console.error('Failed to skip update:', error);
      createAlert('danger', `Failed to skip update: ${error.message}`, 'exclamation-triangle', 5000);
    }
  }

  _formatDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  _renderReleaseNotes(notes) {
    if (!notes) return html`<p class="no-notes">No release notes available</p>`;
    
    // Simple markdown-like rendering
    const formatted = notes
      .replace(/^## (.*$)/gm, '<h3>$1</h3>')
      .replace(/^### (.*$)/gm, '<h4>$1</h4>')
      .replace(/^\* (.*$)/gm, '<li>$1</li>')
      .replace(/^- (.*$)/gm, '<li>$1</li>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/`([^`]+)`/g, '<code>$1</code>');
    
    return html`<div class="release-notes-content">${this._unsafeHTML(formatted)}</div>`;
  }

  _unsafeHTML(htmlString) {
    const template = document.createElement('template');
    template.innerHTML = htmlString;
    return template.content.cloneNode(true);
  }

  render() {
    const info = this.updateInfo;
    const versions = this.availableVersions;
    const selectedInfo = this.selectedVersionInfo;
    // Default to highest available version (first in sorted list)
    const targetVersion = this._selectedVersion || versions[0]?.version;

    if (!info || !info.updateAvailable) {
      return html`
        <div class="panel">
          <p class="no-updates">No updates available for this pup.</p>
        </div>
      `;
    }

    return html`
      <div class="panel">
        <div class="version-info">
          <div class="version-row">
            <span class="label">Current Version</span>
            <span class="version current">${this.currentVersion || info.currentVersion}</span>
          </div>
          
          <sl-icon name="arrow-right" class="arrow"></sl-icon>
          
          <div class="version-row">
            <span class="label">Target Version</span>
            ${versions.length > 1 ? html`
              <version-selector
                .versions=${versions}
                .selectedVersion=${targetVersion}
                @version-change=${this._handleVersionChange}
                size="small"
                class="version-select"
              ></version-selector>
            ` : html`
              <span class="version target">${targetVersion}</span>
            `}
          </div>
        </div>

        ${selectedInfo ? html`
          <div class="release-info">
            <div class="release-header">
              <h4>Release Notes</h4>
              ${selectedInfo.releaseDate ? html`
                <span class="release-date">${this._formatDate(selectedInfo.releaseDate)}</span>
              ` : nothing}
              ${selectedInfo.releaseURL ? html`
                <a href="${selectedInfo.releaseURL}" target="_blank" class="release-link">
                  <sl-icon name="box-arrow-up-right"></sl-icon>
                </a>
              ` : nothing}
            </div>
            <div class="release-notes">
              ${this._renderReleaseNotes(selectedInfo.releaseNotes)}
            </div>
          </div>
        ` : nothing}

        ${this._error ? html`
          <sl-alert variant="danger" open>
            <sl-icon slot="icon" name="exclamation-triangle"></sl-icon>
            ${this._error}
          </sl-alert>
        ` : nothing}

        <div class="actions">
          <sl-button 
            variant="primary" 
            size="medium"
            @click=${this._handleUpgrade}
            ?loading=${this._isUpgrading}
            ?disabled=${this._isUpgrading}
          >
            <sl-icon slot="prefix" name="arrow-up-circle"></sl-icon>
            Upgrade to v${targetVersion}
          </sl-button>
          
          <sl-button 
            variant="text" 
            size="small"
            @click=${this._handleSkip}
            ?disabled=${this._isUpgrading}
          >
            Skip this update
          </sl-button>
        </div>
      </div>
    `;
  }

  static styles = css`
    :host {
      display: block;
    }

    .panel {
      padding: 1em;
    }

    .version-info {
      display: flex;
      align-items: center;
      gap: 1em;
      padding: 1em;
      background: rgba(0, 0, 0, 0.2);
      border-radius: 8px;
      margin-bottom: 1em;
    }

    .version-row {
      display: flex;
      flex-direction: column;
      gap: 0.25em;
    }

    .label {
      font-size: 0.75rem;
      color: rgba(255, 255, 255, 0.5);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .version {
      font-family: 'Comic Neue', sans-serif;
      font-size: 1.25rem;
      font-weight: bold;
    }

    .version.current {
      color: rgba(255, 255, 255, 0.7);
    }

    .version.target {
      color: var(--sl-color-primary-500);
    }

    .arrow {
      font-size: 1.5rem;
      color: rgba(255, 255, 255, 0.3);
    }

    .version-select {
      min-width: 120px;
    }

    .release-info {
      margin-bottom: 1em;
    }

    .release-header {
      display: flex;
      align-items: center;
      gap: 1em;
      margin-bottom: 0.5em;
    }

    .release-header h4 {
      margin: 0;
      font-family: 'Comic Neue', sans-serif;
    }

    .release-date {
      font-size: 0.85rem;
      color: rgba(255, 255, 255, 0.5);
    }

    .release-link {
      color: rgba(255, 255, 255, 0.5);
      text-decoration: none;
    }

    .release-link:hover {
      color: var(--sl-color-primary-500);
    }

    .release-notes {
      max-height: 250px;
      overflow-y: auto;
      padding: 1em;
      background: rgba(0, 0, 0, 0.2);
      border-radius: 8px;
      font-size: 0.9rem;
      line-height: 1.5;
    }

    .release-notes-content h3 {
      margin: 0.5em 0;
      font-size: 1rem;
    }

    .release-notes-content h4 {
      margin: 0.5em 0;
      font-size: 0.9rem;
    }

    .release-notes-content li {
      margin-left: 1em;
      margin-bottom: 0.25em;
    }

    .release-notes-content code {
      background: rgba(255, 255, 255, 0.1);
      padding: 0.1em 0.3em;
      border-radius: 3px;
      font-size: 0.85em;
    }

    .no-notes {
      color: rgba(255, 255, 255, 0.5);
      font-style: italic;
    }

    .no-updates {
      color: rgba(255, 255, 255, 0.5);
      text-align: center;
      padding: 2em;
    }

    sl-alert {
      margin-bottom: 1em;
    }

    .actions {
      display: flex;
      flex-direction: column;
      gap: 0.5em;
      align-items: center;
    }

    .actions sl-button[variant="text"] {
      color: rgba(255, 255, 255, 0.5);
    }
  `;
}

customElements.define("x-pup-update-panel", PupUpdatePanel);

