import { LitElement, html, css, nothing } from "/lib/lit-all.js";
import { createAlert } from "/components/common/alert.js";
import { asyncTimeout } from "/utils/timeout.js";
import { pkgController } from "/controllers/package/index.js";
import { addSource, removeSource } from "/api/sources/manage.js";
import { doBootstrap } from "/api/bootstrap/bootstrap.js";
import { refreshStoreListing } from "/api/sources/sources.js";
import "/components/common/dbx-modal/index.js";

import type { SourceListItem } from "/controllers/package/index.js";

export class SourceManagerView extends LitElement {
  declare _ready: boolean;
  declare _showSourceRemovalConfirmation: boolean;
  declare _showSourceRemovalRejection: boolean;
  declare _showAddSourceDialog: boolean;
  declare _sourceRemovaInProgress: boolean;
  declare _refreshInProgress: boolean;
  declare _sources: SourceListItem[];
  declare _selectedSourceId: string | null;
  declare _addSourceInputURL: string;
  declare _addSourceInProgress: boolean;

  static get properties() {
    return {
      _ready: { type: Boolean },
      _showSourceRemovalConfirmation: { type: Boolean },
      _showSourceRemovalRejection: { type: Boolean },
      _showAddSourceDialog: { type: Boolean },
      _sourceRemovaInProgress: { type: Boolean },
      _refreshInProgress: { type: Boolean },
      _sources: { type: Object, state: true },
      _selectedSourceId: { type: String },
      _addSourceInputURL: { type: String },
      _addSourceInProgress: { type: Boolean },
    }
  }

  constructor() {
    super();
    this._ready = true;
    this._sources = [];
    
    this._showSourceRemovalConfirmation = false;
    this._showSourceRemovalRejection = false;
    this._showAddSourceDialog = false;

    this._refreshInProgress = false;
    this._sourceRemovaInProgress = false;
    this._addSourceInProgress = false;
    
    this._selectedSourceId = null;
    this._addSourceInputURL = "";
  }

  firstUpdated() {
    this.fetchSources()
  }

  fetchSources() {
    this._sources = pkgController.getSourceList()
    this._ready = true;
  }

  async handleRefreshClick() {
    this._refreshInProgress = true;
    try {
      await doBootstrap();
      await refreshStoreListing(true);
      this.fetchSources();
      this.dispatchEvent(new CustomEvent("source-change", { bubbles: true, composed: true }));
    } catch (err) {
      console.warn('Failed to refresh store listing on refresh click', err)
    } finally {
      this._refreshInProgress = false;
    }
  }

  handleRemoveClick(sourceObject: SourceListItem) {
    if (sourceObject.installedCount > 0) {
      this._showSourceRemovalRejection = true;
    } else {
      this._selectedSourceId = sourceObject.sourceId
      this._showSourceRemovalConfirmation = true;
    }
  }

  async handleRemovalConfirmClick() {
    if (!this._selectedSourceId) {
      console.warn('apparantely no source is selected')
    }
    this._sourceRemovaInProgress = true;
    try {
      await asyncTimeout(1000);
      await removeSource(this._selectedSourceId!);
      createAlert("success", ['Source removed.', 'Updating list'], 'check-square', 2000);

      await asyncTimeout(1000);

      // trigger the fetch of store api
      try {
        await refreshStoreListing();
        this.fetchSources();
        pkgController.removePupsBySourceId(this._selectedSourceId!);
        this.dispatchEvent(new CustomEvent("source-change", { bubbles: true, composed: true }));
        
        this._showSourceRemovalConfirmation = false;
      } catch (err) {
        console.warn('Failed to refresh store listing after removing a source', err)
        window.location.reload();
      }

    } catch (err) {
      console.log('ERROR', err);
      const message = ["Source removal failed", "<Todo: Show reason>"];
      const action = { text: "View details" };
      createAlert("danger", message, "emoji-frown", null, action, new Error(String(err)));
    } finally {
      this._sourceRemovaInProgress = false;
      this._selectedSourceId = null;
    }
  }

  handleAddSourceClick() {
    this._addSourceInputURL = "";
    this._showAddSourceDialog = true;
  }

  async handleAddSourceSubmitClick() {
    this._addSourceInProgress = true;
    try {
      await asyncTimeout(1000);
      await addSource(this._addSourceInputURL);
      createAlert("success", ['Source added.', 'Updating list'], 'check-square', 2000);

      // TODO better success handling
      await asyncTimeout(1000);
      
      // trigger the fetch of store api
      try { 
        await refreshStoreListing();
        this.fetchSources();
      } catch (err) {
        console.warn('Failed to refresh store listing after adding a source', err)
        window.location.reload();
      }
      // then close the dialog
      this._showAddSourceDialog = false;
      this._addSourceInputURL = "";

    } catch (err) {
      const message = ["Failed to add source.", "<Todo: Show reason>"];
      const action = { text: "View details" };
      createAlert("danger", message, "emoji-frown", null, action, new Error(String(err)));
    } finally {
      this._addSourceInProgress = false;
    }
  }

  handleClosure() {
    this.dispatchEvent(new CustomEvent("manage-sources-closed", { bubbles: true, composed: true }));
  }

  stopHoistedMenuEvent(event: Event) {
    event.stopPropagation();
  }


  render() {

    const renderAddSource = () => {
      return html`
        <x-dbx-modal
          ?open=${this._showAddSourceDialog}
          title="Add Source"
          footer-text-label="Cancel"
          footerLabel="Add this source"
          footerVariant="primary"
          ?footerDisabled=${!this._addSourceInputURL}
          ?footerLoading=${this._addSourceInProgress}
          @dbx-close=${() => { this._showAddSourceDialog = false; this._addSourceInputURL = ""; }}
          @dbx-footer-text-click=${() => { this._showAddSourceDialog = false; this._addSourceInputURL = ""; }}
          @dbx-footer-click=${() => this.handleAddSourceSubmitClick()}
          @pointerdown=${this.stopHoistedMenuEvent}
          @mousedown=${this.stopHoistedMenuEvent}
          @click=${this.stopHoistedMenuEvent}
        >
          <sl-input
            slot="custom"
            label="Enter source URL"
            placeholder="Eg: https://github.com/Dogebox-WG/pups.git"
            @sl-input=${(e: Event) => this._addSourceInputURL = (e.target as HTMLInputElement).value }
            autofocus
            >
          </sl-input>
        </x-dbx-modal>
      `
    }

    const renderRemovalConfirmation = () => {
      return html`
        <x-dbx-modal
          ?open=${this._showSourceRemovalConfirmation}
          title="Are you sure?"
          subtitle="You will no longer see pups from this source."
          primaryLabel="Yes, delete this source"
          primaryVariant="danger"
          cancelLabel="Cancel"
          ?primaryLoading=${this._sourceRemovaInProgress}
          @dbx-close=${() => this._showSourceRemovalConfirmation = false}
          @dbx-cancel-click=${() => this._showSourceRemovalConfirmation = false}
          @dbx-primary-click=${() => this.handleRemovalConfirmClick()}
          @pointerdown=${this.stopHoistedMenuEvent}
          @mousedown=${this.stopHoistedMenuEvent}
          @click=${this.stopHoistedMenuEvent}
        ></x-dbx-modal>
      `
    }

    const renderRemovalRejection = () => {
      return html`
        <x-dbx-modal
          ?open=${this._showSourceRemovalRejection}
          title="Cannot remove source"
          subtitle="A pup source cannot be removed whilst it has pups installed. Uninstall pups from this source before removing it."
          footerLabel="Dismiss"
          @dbx-close=${() => this._showSourceRemovalRejection = false}
          @dbx-footer-click=${() => this._showSourceRemovalRejection = false}
          @pointerdown=${this.stopHoistedMenuEvent}
          @mousedown=${this.stopHoistedMenuEvent}
          @click=${this.stopHoistedMenuEvent}
        ></x-dbx-modal>
      `
    }

    return html`
      <x-dbx-modal
        open
        title="Pup Sources"
        footer-text-label="Refresh all"
        footerLabel="Add Source"
        footerVariant="success"
        ?footer-text-loading=${this._refreshInProgress}
        ?footer-text-disabled=${!this._ready}
        ?footerDisabled=${!this._ready}
        @dbx-close=${() => this.handleClosure()}
        @dbx-footer-text-click=${() => this.handleRefreshClick()}
        @dbx-footer-click=${() => this.handleAddSourceClick()}
      >
        <div slot="custom">
        ${!this._ready ? html`
          <div class="loader-overlay">
            <sl-spinner style="font-size: 2rem; --indicator-color: #bbb;"></sl-spinner>
          </div>
        ` : nothing }
        
        ${this._ready ? html`

          ${this._sources.map((s) => html`
            <action-row 
              label="${s.name}" 
              prefix="git" 
              variant=${s.error ? 'danger' : ''}
              style="--row-height: ${s.error ? '120px' : '72px'};">
              ${s.location}
              ${s.error ? html`
                <div class="error-indicator">
                  <sl-icon name="exclamation-triangle-fill" style="color: var(--sl-color-danger-600);"></sl-icon>
                  <span class="error-text">${s.error}</span>
                </div>
              ` : nothing}
              <div slot="more" class="source-stats">
                ${s.error ? html`
                  <div class="stat error">
                    <sl-icon name="exclamation-triangle-fill" style="color: var(--sl-color-danger-600);"></sl-icon>
                    <span class="stat-label">Error</span>
                  </div>
                ` : nothing}
                <div class="stat green">
                  <span class="stat-value">${s.pupCount}</span>
                  <span clas="stat-label">Pups</span>
                </div>
                <div class="stat blue">
                  <span class="stat-value">${s.installedCount}</span>
                  <span clas="stat-label">Installed</span>
                </div>
              </div>
              <div class="dropdown-selection-alt" slot="suffix">
                <sl-dropdown hoist>
                  <sl-button slot="trigger" caret></sl-button>
                  <sl-menu>
                    <sl-menu-item
                      value="refres"
                      @pointerdown=${this.stopHoistedMenuEvent}
                      @mousedown=${this.stopHoistedMenuEvent}
                      @click=${(event: Event) => {
                        this.stopHoistedMenuEvent(event);
                        this.handleRefreshClick();
                      }}
                    >
                      Refresh
                    </sl-menu-item>
                    <sl-menu-item
                      value="copy"
                      @pointerdown=${this.stopHoistedMenuEvent}
                      @mousedown=${this.stopHoistedMenuEvent}
                      @click=${(event: Event) => {
                        this.stopHoistedMenuEvent(event);
                        this.handleRemoveClick(s);
                      }}
                    >
                      Remove
                    </sl-menu-item>
                  </sl-menu>
                </sl-dropdown>
              </div>
            </action-row>`
          )}
        ` : nothing }

        ${this._sources.length === 0 ? html`
          <div class="empty">
            No sources found.<br>
            Add a source to get started.
          </div>
        `: nothing}

        </div>
      </x-dbx-modal>

      ${renderRemovalConfirmation()}
      ${renderRemovalRejection()}
      ${renderAddSource()}
    `
  }

  static styles = css`
    .loader-overlay {
      height: 300px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .empty {
      width: 100%;
      color: var(--sl-color-neutral-600);
      box-sizing: border-box;
      border: dashed 1px var(--sl-color-neutral-200);
      border-radius: var(--sl-border-radius-medium);
      padding: var(--sl-spacing-x-large) var(--sl-spacing-medium);
      font-family: 'Comic Neue', sans-serif;
      text-align: center;
    }
    .wider-dialog {
      --width: 99vw;
      @media (min-width: 576px) {
        --width: 65vw;
      }
    }
    .source-details {
      display: flex;
      flex-direction: column;
    }
    .source-stats {
      display: flex;
      flex-direction: row;
      gap: 0.75em;
    }
    .stat-label {
      color: var(--sl-color-neutral-600);
    }

    .stat.blue {
      color: var(--sl-color-blue-600);
    }
    .stat.green {
      color: var(--sl-color-green-600);
    }
    .stat.error {
      color: var(--sl-color-danger-600);
    }

    .error-indicator {
      display: flex;
      align-items: flex-start;
      gap: 0.5em;
      margin-top: 0.5em;
      padding: 0.5em;
      background-color: var(--sl-color-danger-50);
      border: 1px solid var(--sl-color-danger-200);
      border-radius: var(--sl-border-radius-small);
      width: 100%;
      box-sizing: border-box;
      white-space: normal !important;
      overflow: visible !important;
      text-overflow: unset !important;
    }

    .error-text {
      color: var(--sl-color-danger-700);
      font-size: 0.875em;
      font-family: 'Comic Neue', sans-serif;
      flex: 1;
      word-wrap: break-word;
      white-space: normal;
      line-height: 1.4;
    }
  ` 
}

customElements.define("action-manage-sources", SourceManagerView);