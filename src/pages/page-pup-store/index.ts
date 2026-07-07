import { LitElement, html, css, nothing, repeat } from '/lib/lit-all.js';
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

  // Pre-fill the search from URL query params, e.g.
  //   /explore?search=core-network&interfaces=1&description=1
  // "interfaces" and "description" accept 1/true/yes (case-insensitive).
  applySearchFromUrl() {
    const params = new URLSearchParams(window.location.search);

    const search = params.get('search') ?? params.get('q');
    if (search !== null) {
      this.searchValue = search;
    }

    const isTruthy = (v: string | null) => v !== null && ['1', 'true', 'yes'].includes(v.toLowerCase());
    if (params.has('interfaces')) {
      this.searchInInterfaces = isTruthy(params.get('interfaces'));
    }
    if (params.has('description')) {
      this.searchInDescription = isTruthy(params.get('description'));
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
    // installPkg no longer exists on pkgController; guarded so a stray
    // pup-installed event (legacy card-pup-snapshot) cannot throw.
    (this.pkgController as { installPkg?: (pupId: string) => void }).installPkg?.((event as CustomEvent<{ pupid: string }>).detail.pupid)
    this.requestUpdate();
  }

  handlePupClick(event: Event) {
    this.inspectedPup = (event.currentTarget as HTMLElement & { pupId?: string }).pupId
  }

  handleForcedTabShow(event: Event) {
    this.inspectedPup = (event as CustomEvent<{ pupId: string }>).detail.pupId
  }

  async fetchBootstrap() {
    this.reset();
    // Emit busy start event which adds this action to a busy-queue.
    this.dispatchEvent(new CustomEvent('busy-start', {}));

    try {
      const storeListingRes = await getStoreListing()
      this.pkgController.setStoreData(storeListingRes);
      this.packageList.setData(this.pkgController.pups);
      // setData() clears any active filter, so re-apply a search that was
      // pre-filled from the URL (or typed) before the data finished loading.
      if ((this.searchValue || "").trim() !== "") {
        this.filterPackageList();
      }
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
    const selectedItemValue = (event as CustomEvent<{ item: { value: string } }>).detail.item.value;
    switch (selectedItemValue) {
      case 'refresh':
        this.fetchBootstrap();
        break;
    }
  }

  updated(changedProperties: Map<PropertyKey, unknown>) {
    if (changedProperties.has('pups')) {
      this.packageList.setData(this.pups);
      // setData() replaces initial_data and clears any active filter, so a
      // periodic controller refresh (stats/activity notify) would otherwise
      // wipe the user's search. Re-apply the current search if one is active.
      if ((this.searchValue || "").trim() !== "") {
        this.filterPackageList();
      }
    } else if (
      changedProperties.has('searchValue') ||
      changedProperties.has('searchInDescription') ||
      changedProperties.has('searchInInterfaces')
    ) {
      this.filterPackageList();
    }
  }

  handleSearchInput(event: Event) {
    this.searchValue = (event.target as HTMLInputElement).value;
  }

  handleSearchOptionChange(event: Event) {
    const target = event.target as HTMLInputElement;
    const option = target.dataset.option;
    if (option === 'description') {
      this.searchInDescription = target.checked;
    } else if (option === 'interfaces') {
      this.searchInInterfaces = target.checked;
    }
  }

  // Collect the searchable text for a pup based on which search options are
  // currently enabled. Always includes the pup key + display name.
  getSearchableText(pkg: EnrichedPup) {
    const def = pkg?.def;
    const latestVersion = def?.latestVersion ?? "";
    // Older sources used descShort/descLong for the meta description keys.
    const meta = (def?.versions?.[latestVersion]?.meta || {}) as {
      name?: string;
      shortDescription?: string;
      longDescription?: string;
      descShort?: string;
      descLong?: string;
    };
    const version = def?.versions?.[latestVersion] || {};

    const parts = [def?.key || "", meta.name || ""];

    if (this.searchInDescription) {
      parts.push(
        meta.shortDescription || meta.descShort || "",
        meta.longDescription || meta.descLong || "",
      );
    }

    if (this.searchInInterfaces) {
      // Only interfaces this pup provides (not the ones it depends on).
      (version.interfaces || []).forEach((iface) => parts.push(iface?.name || ""));
    }

    return parts.join(" ").toLowerCase();
  }

  filterPackageList() {
    const query = (this.searchValue || "").trim().toLowerCase();

    // Reset to first page so results aren't hidden on an out-of-range page.
    this.packageList.currentPage = 1;

    if (query === "") {
      this.packageList.setFilter();
      return;
    }

    this.packageList.setFilter((pkg: EnrichedPup) => this.getSearchableText(pkg).includes(query));
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
            <sl-checkbox
              size="small"
              data-option="description"
              ?checked=${this.searchInDescription}
              @sl-change=${this.handleSearchOptionChange}>
              Descriptions
            </sl-checkbox>
            <sl-checkbox
              size="small"
              data-option="interfaces"
              ?checked=${this.searchInInterfaces}
              @sl-change=${this.handleSearchOptionChange}>
              Interfaces Provided
            </sl-checkbox>
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
      margin-top: 0.6em;
      padding-left: 0.25em;
    }

    .search-options-label {
      font-size: 0.75rem;
      text-transform: uppercase;
      font-weight: bold;
      color: var(--sl-color-neutral-500);
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
