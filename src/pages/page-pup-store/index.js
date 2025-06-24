import { LitElement, html, css, nothing, repeat } from '/vendor/@lit/all@3.1.2/lit-all.min.js';
import { getStoreListing } from '/api/sources/sources.js';
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
  if (a?.def?.versions[a?.def?.versionLatest]?.meta?.name < b?.def?.versions[b?.def?.versionLatest]?.meta?.name) { return -1; }
  if (a?.def?.versions[a?.def?.versionLatest] > b?.def?.versions[b?.def?.versionLatest]?.meta?.name) { return 1; }
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
      _hasSourceErrors: { type: Boolean }
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
      const storeListingRes = await getStoreListing()
      this.pkgController.setStoreData(storeListingRes);
      this.packageList.setData(this.pkgController.pups);
      this.checkForSourceErrors();
    } catch (err) {
      console.error(err);
      this.fetchError = true;
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
    this._hasSourceErrors = sources.some(source => source.error);
  }

  render() {
    const ready = (
      !this.fetchLoading &&
      !this.fetchError &&
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
  `
}

customElements.define('x-page-pup-store', StoreView);
