import { LitElement, html, css, nothing } from "/vendor/@lit/all@3.1.2/lit-all.min.js";
import { createAlert } from "/components/common/alert.js";
import { asyncTimeout } from "/utils/timeout.js";
import { pkgController } from "/controllers/package/index.js";
import { addSource, removeSource } from "/api/sources/manage.js";
import { doBootstrap } from "/api/bootstrap/bootstrap.js";
import { refreshStoreListing } from "/api/sources/sources.js";

export class SourceManagerView extends LitElement {

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
      await refreshStoreListing("flush");
      this.fetchSources();
      this.dispatchEvent(new CustomEvent("source-change", { bubbles: true, composed: true }));
    } catch (err) {
      console.warn('Failed to refresh store listing on refresh click', err)
    } finally {
      this._refreshInProgress = false;
    }
  }

  handleRemoveClick(sourceObject) {
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
      await removeSource(this._selectedSourceId);
      createAlert("success", ['Source removed.', 'Updating list'], 'check-square', 2000);

      await asyncTimeout(1000);

      // trigger the fetch of store api
      try {
        await refreshStoreListing();
        this.fetchSources();
        pkgController.removePupsBySourceId(this._selectedSourceId);
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
      createAlert("danger", message, "emoji-frown", null, action, new Error(err));
    } finally {
      this._sourceRemovaInProgress = false;
      this._selectedSourceId = null;
    }
  }

  handleAddSourceClick() {
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

    } catch (err) {
      const message = ["Failed to add source.", "<Todo: Show reason>"];
      const action = { text: "View details" };
      createAlert("danger", message, "emoji-frown", null, action, new Error(err));
    } finally {
      this._addSourceInProgress = false;
    }
  }

  handleClosure(event) {
    // Check if the event target is the dialog with id "ManageSourcesDialog"
    if (event.target.id === "ManageSourcesDialog") {
      this.dispatchEvent(new CustomEvent("manage-sources-closed", { bubbles: true, composed: true }));
    }
  }


  render() {

    const renderAddSource = () => {
      return html`
        <sl-dialog ?open=${this._showAddSourceDialog} class="wider-dialog" no-header>
          
          <sl-input
            label="Enter source URL"
            placeholder="Eg: https://github.com/Dogebox-WG/pups.git"
            @sl-input=${(e) => this._addSourceInputURL = e.target.value }
            autofocus
            >
          </sl-input>

          <div slot="footer">
            <sl-button variant="text" @click=${() => this._showAddSourceDialog = false}>Cancel</sl-button>
            <sl-button variant="primary" ?disabled=${!this._addSourceInputURL} ?loading=${this._addSourceInProgress} @click=${this.handleAddSourceSubmitClick}>
              Add this source
            </sl-button>
          </div>
          
        </sl-dialog>
      `
    }

    const renderRemovalConfirmation = () => {
      return html`
        <sl-dialog ?open=${this._showSourceRemovalConfirmation} class="wider-dialog" no-header>
          <div>
            <h3>Are you sure?</h3>
            You will no longer see pups from this source.
          </div>
          <div slot="footer">
            <sl-button variant="text" @click=${() => this._showSourceRemovalConfirmation = false}>Cancel</sl-button>
            <sl-button variant="danger" ?loading=${this._sourceRemovaInProgress} @click=${this.handleRemovalConfirmClick}>
              Yes, delete this source
              <sl-icon slot="suffix" name="trash3-fill"></sl-icon>
            </sl-button>
          </div>
          
        </sl-dialog>
      `
    }

    const renderRemovalRejection = () => {
      return html`
        <sl-dialog ?open=${this._showSourceRemovalRejection} class="wider-dialog" no-header>
          <div>
            <h3>Cannot remove source</h3>
            A pup source cannot be removed whilst it has pups installed.<br>
            Uninstall pups from this source before removing it.
          </div>
          <div slot="footer">
            <sl-button variant="primary" @click=${() => this._showSourceRemovalRejection = false}>
              Dismiss
            </sl-button>
          </div>
          
        </sl-dialog>
      `
    }

    return html`
      <sl-dialog id="ManageSourcesDialog" open label="Pup Sources" style="position: relative;" @sl-after-hide=${this.handleClosure}>
        
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
                    <sl-menu-item value="refres" @click=${() => this.handleRefreshClick(s)}>Refresh</sl-menu-item>
                    <sl-menu-item value="copy" @click=${() => this.handleRemoveClick(s)}>Remove</sl-menu-item>
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

        <div slot="footer">
          <sl-button variant="text"
            ?loading=${this._refreshInProgress}
            ?disabled=${!this._ready}
            @click=${this.handleRefreshClick}>
            Refresh all
          </sl-button>
          <sl-button variant=success
            ?disabled=${!this._ready}
            @click=${this.handleAddSourceClick}>
            <sl-icon slot="prefix" name="plus-square-fill"></sl-icon>
            Add Source
          </sl-button>
        </div>
      
      ${renderRemovalConfirmation()}
      ${renderRemovalRejection()}
      ${renderAddSource()}
      </sl-dialog>
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