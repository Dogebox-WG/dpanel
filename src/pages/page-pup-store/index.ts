import { LitElement, html, css, nothing, repeat } from '/lib/lit-all.js';
import { getStoreListing } from '/api/sources/sources.js';
import { pkgController } from '/controllers/package/index.js'
import { PaginationController } from '/components/common/paginator/paginator-controller.js';
import { bindToClass } from '/utils/class-bind.js'
import {
  parsePupSearchFromUrl,
  getStoreSearchableText,
} from '/components/utils/pup-search.js';
import * as renderMethods from './renders/index.js';
import '/components/views/card-pup-install/index.js'
import '/components/common/paginator/paginator-ui.js';
import '/components/common/page-banner.js';
import '/components/views/action-manage-sources/index.js';

import type { EnrichedPup } from '/types/pup-model';

const initialSort = (a: EnrichedPup, b: EnrichedPup) => {
  const nameA = a?.def?.versions?.[a?.def?.latestVersion ?? '']?.meta?.name || '';
  const nameB = b?.def?.versions?.[b?.def?.latestVersion ?? '']?.meta?.name || '';
  
  // Default alphabetical sort
  if (nameA < nameB) return -1;
  if (nameA > nameB) return 1;
  return 0;
}

interface StoreCategory {
  name: string;
  label: string;
  disabled?: boolean;
}

export class StoreView extends LitElement {
  declare pups: EnrichedPup[];
  declare fetchLoading: boolean;
  declare fetchError: boolean;
  declare busy: boolean;
  declare inspectedPup: string | undefined;
  declare searchValue: string;
  declare searchInDescription: boolean;
  declare searchInInterfaces: boolean;
  declare _showSourceManagementDialog: boolean;
  declare _hasSourceErrors: boolean;

  busyQueue: EventTarget[];
  itemsPerPage: number;
  pkgController: typeof pkgController;
  packageList: PaginationController<EnrichedPup>;
  showCategories: boolean;
  categories: StoreCategory[];

  // Render chunks mixed in via bindToClass(renderMethods, this).
  declare renderSectionBody: (ready: unknown, SKELS: unknown[], hasItems: (nickname: string) => boolean | undefined) => unknown;

  static get properties() {
    return {
      pups: { type: Array },
      fetchLoading: { type: Boolean },
      fetchError: { type: Boolean },
      busy: { type: Boolean },
      inspectedPup: { type: String },
      searchValue: { type: String },
      searchInDescription: { type: Boolean },
      searchInInterfaces: { type: Boolean },
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
    this.searchValue = "";
    this.searchInDescription = false;
    this.searchInInterfaces = false;
    this.itemsPerPage = 10;
    this.pkgController = pkgController;
    this.packageList = new PaginationController<EnrichedPup>(this, undefined, this.itemsPerPage,{ initialSort });
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
    // Stable filter: query via setQuery; option flags read live from `this`.
    this.packageList.setFilter((pkg, query) => {
      const q = (query || "").trim().toLowerCase();
      if (!q) return true;
      return getStoreSearchableText(pkg, {
        description: this.searchInDescription,
        interfaces: this.searchInInterfaces,
      }).includes(q);
    });
    bindToClass(renderMethods, this);
  }

  connectedCallback() {
    super.connectedCallback();
    this.applySearchFromUrl();
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

  // Prefill from URL, e.g. /explore?search=wallet&interfaces=1&description=1
  applySearchFromUrl() {
    const {
      searchValue,
      searchInDescription,
      searchInInterfaces,
    } = parsePupSearchFromUrl();

    this.searchValue = searchValue;
    this.searchInDescription = searchInDescription;
    this.searchInInterfaces = searchInInterfaces;

    if ((this.searchValue || "").trim() !== "") {
      this.packageList.setQuery(this.searchValue);
    }
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

  handleBusyStart(event: Event) {
    if (event.target) this.busyQueue.push(event.target);
    this.updateBusyState();
  }

  handleBusyStop(event: Event) {
    // Remove the identifier of the event source from the queue
    const index = event.target ? this.busyQueue.indexOf(event.target) : -1;
    if (index > -1) {
      this.busyQueue.splice(index, 1);
    }
    setTimeout(() => {
      this.updateBusyState();
    }, 500);
  }

  handlePupInstalled(event: Event) {
    event.stopPropagation();
    if (!(event instanceof CustomEvent)) return;
    const detail: { pupid: string } = event.detail;
    // installPkg no longer exists on pkgController; guarded so a stray
    // pup-installed event (legacy card-pup-snapshot) cannot throw.
    const controller = this.pkgController;
    if ('installPkg' in controller && typeof controller.installPkg === 'function') {
      controller.installPkg(detail.pupid);
    }
    this.requestUpdate();
  }

  handlePupClick(event: Event) {
    const el = event.currentTarget;
    if (el instanceof HTMLElement && 'pupId' in el) {
      this.inspectedPup = typeof el.pupId === 'string' ? el.pupId : undefined;
    }
  }

  handleForcedTabShow(event: Event) {
    if (!(event instanceof CustomEvent)) return;
    const detail: { pupId: string } = event.detail;
    this.inspectedPup = detail.pupId
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
    this.pups = this.pkgController.pups.filter(p => p.def);
    this.checkForSourceErrors();
    this.requestUpdate('pups');
  }

  handleActionsMenuSelect(event: Event) {
    if (!(event instanceof CustomEvent)) return;
    const detail: { item: { value: string } } = event.detail;
    const selectedItemValue = detail.item.value;
    switch (selectedItemValue) {
      case 'refresh':
        this.fetchBootstrap();
        break;
    }
  }

  updated(changedProperties: Map<PropertyKey, unknown>) {
    if (changedProperties.has('pups')) {
      this.packageList.setData(this.pups);
    }
  }

  handleSearchInput(event: Event) {
    const target = event.target;
    if (target instanceof HTMLElement && 'value' in target && typeof target.value === 'string') {
      this.searchValue = target.value;
      this.packageList.setQuery(this.searchValue);
    }
  }

  handleSearchOptionChange(event: Event) {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const option = target.dataset.option;
    const checked = 'checked' in target ? Boolean(target.checked) : false;
    if (option === 'description') {
      this.searchInDescription = checked;
    } else if (option === 'interfaces') {
      this.searchInInterfaces = checked;
    }
    // Re-apply current query so the stable filter re-reads option flags.
    this.packageList.setQuery(this.searchValue);
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

    const hasItems = (listNickname: string) => {
      switch(listNickname) {
        case 'packages':
          return Boolean(this.packageList.data.length)
          break;
      }
    }

    const SKELS = Array.from({ length: 1 })
    const totalPages = this.packageList.data ? Math.max(this.packageList.getTotalPages(), 1) : 1;
    const paginationDisabled = this.busy || this.fetchLoading || this.fetchError || !this.packageList.data;

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
        <div class="constrained w55 search-inner">
          <sl-input
            type="search"
            size="large"
            placeholder="Search"
            clearable
            .value=${this.searchValue}
            @sl-input=${this.handleSearchInput}>
            <sl-icon name="search" slot="prefix"></sl-icon>
          </sl-input>
          <div class="search-options">
            <span class="search-options-label">Also search:</span>
            <div class="search-options-checks">
              <sl-switch
                size="small"
                data-option="description"
                ?checked=${this.searchInDescription}
                @sl-change=${this.handleSearchOptionChange}>
                Descriptions
              </sl-switch>
              <sl-switch
                size="small"
                data-option="interfaces"
                ?checked=${this.searchInInterfaces}
                @sl-change=${this.handleSearchOptionChange}>
                Interfaces Provided
              </sl-switch>
            </div>
          </div>
        </div>
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

      <div class="pagination-dock">
        <paginator-ui
          ?disabled=${paginationDisabled}
          @go-next=${this.packageList.nextPage}
          @go-prev=${this.packageList.previousPage}
          currentPage=${this.packageList.currentPage}
          totalPages=${totalPages}
        ></paginator-ui>
      </div>

      ${this._showSourceManagementDialog ? html`
        <action-manage-sources></action-manage-sources>
      ` : nothing }

    `;
  }

  static styles = css`
    :host {
      --pagination-dock-height: 72px;
      box-sizing: border-box;
      display: block;
      padding: 20px 20px calc(20px + var(--pagination-dock-height));
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

    .search-inner sl-input {
      width: 100%;
    }

    .search-options {
      display: flex;
      flex-direction: row;
      flex-wrap: wrap;
      align-items: center;
      gap: 1em;
      line-height: 0;
      margin-top: 0.6em;
      padding-left: 0.25em;
    }

    .search-options-checks {
      display: flex;
      flex-direction: row;
      flex-wrap: wrap;
      align-items: center;
      gap: 1em;
    }

    .search-options-label {
      text-transform: uppercase;
      font-weight: bold;
      color: var(--sl-color-neutral-500);
      padding-left: 0.25em;
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

    .pagination-dock {
      position: fixed;
      left: var(--page-margin-left);
      right: 0;
      bottom: 0;
      z-index: 90;
      height: var(--pagination-dock-height);
      display: flex;
      align-items: center;
      justify-content: flex-end;
      box-sizing: border-box;
      padding: 0 20px;
      background: #23252a;
      border-top: 1px solid rgba(255, 255, 255, 0.06);
    }

    .pagination-dock paginator-ui {
      width: 100%;
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
