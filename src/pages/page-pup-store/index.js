import { LitElement, html, css, nothing, repeat } from '/vendor/@lit/all@3.1.2/lit-all.min.js';
import { getStoreListing } from '/api/sources/sources.js';
import { getBootstrapV2 } from '/api/bootstrap/bootstrap.js';
import { pkgController } from '/controllers/package/index.js'
import { PaginationController } from '/components/common/paginator/paginator-controller.js';
import { bindToClass } from '/utils/class-bind.js'
import { asyncTimeout } from '/utils/timeout.js'
import * as renderMethods from './renders/index.js';
import '/components/views/card-pup-install/index.js'
import '/components/common/paginator/paginator-ui.js';
import '/components/common/page-banner.js';
import '/components/views/action-manage-sources/index.js';

const initialSort = (a, b) => {
  const nameA = a?.def?.versions?.[a?.def?.latestVersion]?.meta?.name || '';
  const nameB = b?.def?.versions?.[b?.def?.latestVersion]?.meta?.name || '';
  
  // Default alphabetical sort
  if (nameA < nameB) return -1;
  if (nameA > nameB) return 1;
  return 0;
}

class StoreView extends LitElement {

  static get properties() {
    return {
      pups: { type: Array },
      fetchLoading: { type: Boolean },
      fetchError: { type: Boolean },
      busy: { type: Boolean },
      inspectedPup: { type: String },
      searchValue: { type: String },
      _showSourceManagementDialog: { type: Boolean },
      _hasSourceErrors: { type: Boolean },
      _sourceCount: { type: Number },
      _sourceErrorCount: { type: Number },
      _allSourcesErrored: { type: Boolean },
      _internetConnectivity: { type: Boolean }
    }
  }

  constructor() {
    super();
    this.pups = [];
    this.busy = false;
    this.busyQueue = [];
    this.fetchLoading = true;
    this.fetchError = false;
    this.itemsPerPage = 10;
    this.pkgController = pkgController;
    this.packageList = new PaginationController(this, undefined, this.itemsPerPage,{ initialSort });
    this._showSourceManagementDialog = false;
    this._hasSourceErrors = false;
    this._sourceCount = 0;
    this._sourceErrorCount = 0;
    this._allSourcesErrored = false;
    this._internetConnectivity = null;

    this.inspectedPup;
    this.showCategories = false;
    this.categories = [
      { name: "all", label: "All" },
      { name: "meme", label: "Memes" },
      { name: "social", label: "Social" },
      { name: "transact", label: "Transact" },
      { name: "blockchain", label: "Blockchain" },
      { name: "develop", label: "Develop" },
      { name: "Write", label: "Write" },
      { name: "host", label: "Host" },
    ]
    bindToClass(renderMethods, this);
  }

  connectedCallback() {
    super.connectedCallback();
    this.pkgController.addObserver(this);
    this.addEventListener('busy-start', this.handleBusyStart.bind(this));
    this.addEventListener('busy-stop', this.handleBusyStop.bind(this));
    this.addEventListener('pup-installed', this.handlePupInstalled.bind(this));
    this.addEventListener('forced-tab-show', this.handleForcedTabShow.bind(this));
    this.addEventListener('manage-sources-closed', this.handleManageSourcesClosed.bind(this));
    this.addEventListener('source-change', this.updatePups.bind(this));
    this.fetchBootstrap();
    this.checkForSourceErrors();
  }

  disconnectedCallback() {
    this.removeEventListener('busy-start', this.handleBusyStart.bind(this));
    this.removeEventListener('busy-stop', this.handleBusyStop.bind(this));
    this.removeEventListener('pup-installed', this.handlePupInstalled.bind(this));
    this.removeEventListener('forced-tab-show', this.handleForcedTabShow.bind(this));
    this.removeEventListener('manage-sources-closed', this.handleManageSourcesClosed.bind(this));
    this.removeEventListener('source-change', this.updatePups.bind(this));
    this.pkgController.removeObserver(this);
    super.disconnectedCallback();
  }

  handleManageSourcesClosed() {
    this._showSourceManagementDialog = false;
  }

  reset() {
    this.fetchLoading = true;
    this.fetchError = false;
  }

  updateBusyState() {
    this.busy = this.busyQueue.length > 0;
  }

  handleBusyStart(event) {
    this.busyQueue.push(event.target);
    this.updateBusyState();
  }

  handleBusyStop(event) {
    // Remove the identifier of the event source from the queue
    const index = this.busyQueue.indexOf(event.target);
    if (index > -1) {
      this.busyQueue.splice(index, 1);
    }
    setTimeout(() => {
      this.updateBusyState();
    }, 500);
  }

  handlePupInstalled(event) {
    event.stopPropagation();
    this.pkgController.installPkg(event.detail.pupid)
    this.requestUpdate();
  }

  handlePupClick(event) {
    this.inspectedPup = event.currentTarget.pupId
  }

  handleForcedTabShow(event) {
    this.inspectedPup = event.detail.pupId
  }

  async fetchBootstrap() {
    this.reset();
    // Emit busy start event which adds this action to a busy-queue.
    this.dispatchEvent(new CustomEvent('busy-start', {}));

    try {
      const [storeListingRes, bootstrapRes] = await Promise.all([
        getStoreListing(),
        getBootstrapV2().catch((err) => {
          console.warn('Failed to refresh bootstrap while loading Pup Store', err);
          return null;
        }),
      ]);

      if (bootstrapRes) {
        this.pkgController.setData(bootstrapRes);
      }

      this.pkgController.setStoreData(storeListingRes);
      this.packageList.setData(this.pkgController.pups);
      this.checkForSourceErrors();
    } catch (err) {
      console.error(err);
      this.fetchError = true;
      this.checkForSourceErrors();
    } finally {
      // Emit a busy stop event which removes this action from the busy-queue.
      this.dispatchEvent(new CustomEvent('busy-stop', {}));
      this.fetchLoading = false
    }
  }

  updatePups() {
    this.pups = [...this.pkgController.pups];
    this.checkForSourceErrors();
    this.requestUpdate('pups');
  }

  handleActionsMenuSelect(event) {
    const selectedItemValue = event.detail.item.value;
    switch (selectedItemValue) {
      case 'refresh':
        this.fetchBootstrap();
        break;
    }
  }

  updated(changedProperties) {
    if (changedProperties.has('pups')) {
      this.packageList.setData(this.pups);
    }
    
    // Existing code for other property changes
    if (changedProperties.has('searchValue')) {
      this.filterPackageList();
    }
  }

  filterPackageList() {
    if (this.searchValue === "") {
      this.packageList.setFilter();
    }
    this.packageList.setFilter((pkg) => pkg?.manifest?.package?.toLowerCase()?.includes(this.searchValue.toLowerCase()));
  }

  handleManageSourcesClick() {
    this._showSourceManagementDialog = true;
  }

  checkForSourceErrors() {
    const sources = this.pkgController.getSourceList();
    const sourceErrorCount = sources.filter((source) => Boolean(source.error)).length;

    this._sourceCount = sources.length;
    this._sourceErrorCount = sourceErrorCount;
    this._hasSourceErrors = sourceErrorCount > 0;
    this._allSourcesErrored = sources.length > 0 && sourceErrorCount === sources.length;
    this._internetConnectivity = this.pkgController.internetConnectivity;
  }

  renderFetchError() {
    if (!this.fetchError) {
      return nothing;
    }

    const hasCachedPackages = Boolean(this.packageList?.data?.length);
    const body = hasCachedPackages
      ? 'The latest refresh failed. Showing the most recent Pup Store data.'
      : 'The Pup Store could not be refreshed. Try again or review your configured sources.';

    return html`
      <sl-alert open variant="danger" class="source-warning">
        <sl-icon slot="icon" name="exclamation-octagon-fill"></sl-icon>
        <div class="source-warning-copy">
          <strong>Could not refresh the Pup Store</strong>
          <span>${body}</span>
        </div>
        <div class="source-warning-actions">
          <sl-button size="small" @click=${this.fetchBootstrap} ?disabled=${this.fetchLoading}>
            Retry
          </sl-button>
          <sl-button size="small" variant="text" @click=${this.handleManageSourcesClick}>
            Manage Sources
          </sl-button>
        </div>
      </sl-alert>
    `;
  }

  renderSourceWarning() {
    if (!this._hasSourceErrors) {
      return nothing;
    }

    if (this._allSourcesErrored) {
      const body = this._sourceCount === 1
        ? 'The Pup Store could not reach its source. Check the source configuration or try again.'
        : `None of the ${this._sourceCount} pup sources could be reached. Check the source configuration or try again.`;

      return html`
        <sl-alert open variant="warning" class="source-warning">
          <div class="source-warning-copy">
            <div class="source-warning-title">
              <sl-icon class="source-warning-title-icon" name="exclamation-triangle-fill"></sl-icon>
              <strong>All pup sources are unavailable</strong>
            </div>
            <span>${body}</span>
          </div>
          <div class="source-warning-actions">
            <sl-button size="small" @click=${this.fetchBootstrap} ?disabled=${this.fetchLoading}>
              Retry
            </sl-button>
            <sl-button size="small" variant="text" @click=${this.handleManageSourcesClick}>
              Manage Sources
            </sl-button>
          </div>
        </sl-alert>
      `;
    }

    return html`
      <sl-alert open variant="warning" class="source-warning">
        <sl-icon slot="icon" name="exclamation-triangle-fill"></sl-icon>
        <div class="source-warning-copy">
          <strong>Some pup sources are unavailable</strong>
          <span>${this._sourceErrorCount} of ${this._sourceCount} pup sources could not be reached.</span>
        </div>
        <div class="source-warning-actions">
          <sl-button size="small" variant="text" @click=${this.handleManageSourcesClick}>
            Manage Sources
          </sl-button>
        </div>
      </sl-alert>
    `;
  }

  renderInternetWarning() {
    if (this._internetConnectivity !== false) {
      return nothing;
    }

    return html`
      <sl-alert open variant="primary" class="source-warning">
        <sl-icon slot="icon" name="wifi-off"></sl-icon>
        <div class="source-warning-copy">
          <strong>Internet connection appears offline</strong>
          <span>Internet-backed pup sources may be unavailable, even if local or LAN sources still load.</span>
        </div>
      </sl-alert>
    `;
  }

  render() {
    const ready = (
      !this.fetchLoading &&
      this.packageList.data
    )

    const hasItems = (listNickname) => {
      switch(listNickname) {
        case 'packages':
          return Boolean(this.packageList.data.length)
          break;
      }
    }

    const SKELS = Array.from({ length: 1 })

    return html`
      <page-banner title="Pup Store" subtitle="Dogebox">
        <div class="slogan-wrap">
          Extend your Dogebox with Pups
          <sl-button size="large" variant="text" ?disabled=${this.fetchLoading} @click=${this.handleManageSourcesClick} class=${this._hasSourceErrors ? 'source-error' : ''}>
            <sl-icon name=${this._hasSourceErrors ? 'exclamation-triangle-fill' : 'database-fill-add'} slot="prefix"></sl-icon>
            Manage Sources
          </sl-button>
        </div>
      </page-banner>

      <div class="row search-wrap">
        <sl-input class="constrained w55" type="search" size="large" placeholder="Search">
          <sl-icon name="search" slot="prefix"></sl-icon>
        </sl-input>
      </div>

      ${this.showCategories ? html`
        <div class="tab-wrap constrained w80">
          <sl-tab-group class="cat-picker">
            ${this.categories.map((c) => html`
              <sl-tab slot="nav" ?disabled=${c.disabled} panel="${c.name}">${c.label}</sl-tab>
            `)}
          </sl-tab-group>
        </div>
      ` : nothing }

      ${this.renderFetchError()}
      ${this.renderInternetWarning()}
      ${this.renderSourceWarning()}

      ${this.fetchLoading
        ? html`<sl-spinner style="--indicator-color:#777;"></sl-spinner>`
        : this.renderSectionBody(ready, SKELS, hasItems)
      }

      ${this._showSourceManagementDialog ? html`
        <action-manage-sources></action-manage-sources>
      ` : nothing }

    `;
  }

  static styles = css`
    :host {
      display: block;
      padding: 20px;
    }

    div.row {
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 2em;
      width: 100%;
    }

    .constrained {
      width: 100%;
      @media (min-width:576px) {
        &.w55 { width: 55% }
        &.w80 { width: 80% }
      }
    }

    .tab-wrap {
      margin-left: auto;
      margin-right: auto;
      margin-bottom: 3em
    }

    .cat-picker {
      --indicator-color: white;
      sl-tab::part(base) { color: grey; }
      sl-tab[active]::part(base) { color: white; }
      sl-tab::part(base):hover { color: white; }
      
      margin-left: auto;
      margin-right: auto;
      position: relative;
      top: 2px;
      
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

    .slogan-wrap {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      @media (min-width: 800px) {
        display: flex;
        flex-direction: row;
        gap: 1.5em;
        justify-content: center;
        align-items: center;
      }
    }

    .source-error {
      color: var(--sl-color-warning-600) !important;
    }

    .source-error::part(base) {
      color: var(--sl-color-warning-600) !important;
    }

    .source-warning {
      max-width: 960px;
      margin: 0 auto 1.5rem auto;
    }

    .source-warning::part(base) {
      align-items: flex-start;
    }

    .source-warning-copy {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .source-warning-title {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .source-warning-title-icon {
      flex: 0 0 auto;
    }

    .source-warning-actions {
      display: flex;
      gap: 0.5rem;
      margin-top: 0.75rem;
      flex-wrap: wrap;
    }
  `
}

customElements.define('x-page-pup-store', StoreView);
