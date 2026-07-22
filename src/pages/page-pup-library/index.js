import { LitElement, html, css, nothing, repeat } from '/lib/lit-all.js';
import '/components/views/card-pup-manage/index.js'
import '/components/common/paginator/paginator-ui.js';
import { getBootstrapV2 } from '/api/bootstrap/bootstrap.js';
import { pkgController } from '/controllers/package/index.js'
import { PaginationController } from '/components/common/paginator/paginator-controller.js';
import { bindToClass } from '/utils/class-bind.js'
import * as renderMethods from './renders/index.js';

const initialSort = (a, b) => {
  const nameA = a?.state?.manifest?.meta?.name || '';
  const nameB = b?.state?.manifest?.meta?.name || '';
  
  // Default alphabetical sort
  if (nameA < nameB) return -1;
  if (nameA > nameB) return 1;
  return 0;
}

class LibraryView extends LitElement {

  static properties = {
    fetchLoading: { type: Boolean },
    fetchError: { type: Boolean },
    packageList: { type: Array },
    busy: { type: Boolean },
    inspectedPup: { type: String },
    searchValue: { type: String },
    searchInDescription: { type: Boolean },
    searchInInterfaces: { type: Boolean },
  }

  constructor() {
    super();
    this.busy = false;
    this.busyQueue = [];
    this.fetchLoading = true;
    this.fetchError = false;
    this.searchValue = "";
    this.searchInDescription = false;
    this.searchInInterfaces = false;
    this.itemsPerPage = 20;
    this.pkgController = pkgController;
    this.installedList = new PaginationController(this, undefined, this.itemsPerPage, { initialSort });
    // this.availableList = new PaginationController(this, undefined, this.itemsPerPage);
    this.inspectedPup;
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
    this.fetchBootstrap();
  }

  disconnectedCallback() {
    this.removeEventListener('busy-start', this.handleBusyStart.bind(this));
    this.removeEventListener('busy-stop', this.handleBusyStop.bind(this));
    this.removeEventListener('pup-installed', this.handlePupInstalled.bind(this));
    this.removeEventListener('forced-tab-show', this.handleForcedTabShow.bind(this));
    this.pkgController.removeObserver(this);
    super.disconnectedCallback();
  }

  // Pre-fill the search from URL query params, e.g.
  //   /pups?search=wallet&interfaces=1&description=1
  applySearchFromUrl() {
    const params = new URLSearchParams(window.location.search);

    const search = params.get('search') ?? params.get('q');
    if (search !== null) {
      this.searchValue = search;
    }

    const isTruthy = (v) => v !== null && ['1', 'true', 'yes'].includes(v.toLowerCase());
    if (params.has('interfaces')) {
      this.searchInInterfaces = isTruthy(params.get('interfaces'));
    }
    if (params.has('description')) {
      this.searchInDescription = isTruthy(params.get('description'));
    }
  }

  reset() {
    this.fetchLoading = true;
    this.fetchError = false;
    this.packageList = null;
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
      const res = await getBootstrapV2()
      this.pkgController.setData(res);
      this.installedList.setData(this.pkgController.pups.filter(p => p.state));
      if ((this.searchValue || "").trim() !== "") {
        this.filterInstalledList();
      }
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
    this.installedList.setData(this.pkgController.pups.filter(p => p.state));
    if ((this.searchValue || "").trim() !== "") {
      this.filterInstalledList();
    }
    this.requestUpdate();
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
    if (
      changedProperties.has('searchValue') ||
      changedProperties.has('searchInDescription') ||
      changedProperties.has('searchInInterfaces')
    ) {
      this.filterInstalledList();
    }
  }

  handleSearchInput(event) {
    this.searchValue = event.target.value;
  }

  handleSearchOptionChange(event) {
    const option = event.target.dataset.option;
    if (option === 'description') {
      this.searchInDescription = event.target.checked;
    } else if (option === 'interfaces') {
      this.searchInInterfaces = event.target.checked;
    }
  }

  getSearchableText(pkg) {
    const manifest = pkg?.state?.manifest || {};
    const meta = manifest.meta || {};

    const parts = [meta.name || "", pkg?.state?.id || ""];

    if (this.searchInDescription) {
      parts.push(
        meta.shortDescription || meta.descShort || "",
        meta.longDescription || meta.descLong || "",
      );
    }

    if (this.searchInInterfaces) {
      (manifest.interfaces || []).forEach((iface) => parts.push(iface?.name || ""));
    }

    return parts.join(" ").toLowerCase();
  }

  filterInstalledList() {
    const query = (this.searchValue || "").trim().toLowerCase();

    this.installedList.currentPage = 1;

    if (query === "") {
      this.installedList.setFilter();
      return;
    }

    this.installedList.setFilter((pkg) => this.getSearchableText(pkg).includes(query));
  }

  render() {
    const ready = (
      !this.fetchLoading &&
      !this.fetchError &&
      this.installedList.data
    )

    const hasItems = (listNickname) => {
      switch(listNickname) {
        case 'installed':
          return Boolean(this.installedList.data.length)
          break;
      }
    }

    const SKELS = Array.from({ length: 1 })
    const totalPages = this.installedList.data ? Math.max(this.installedList.getTotalPages(), 1) : 1;
    const paginationDisabled = this.busy || this.fetchLoading || this.fetchError || !this.installedList.data;

    return html`
      <div class="padded">
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
        </div>

        ${this.fetchLoading 
          ? html`<sl-spinner style="--indicator-color:#777;"></sl-spinner>
        ` : this.renderSectionInstalledBody(ready, SKELS, hasItems) }
      </div>

      <div class="pagination-dock">
        <paginator-ui
          ?disabled=${paginationDisabled}
          @go-next=${this.installedList.nextPage}
          @go-prev=${this.installedList.previousPage}
          currentPage=${this.installedList.currentPage}
          totalPages=${totalPages}
        ></paginator-ui>
      </div>

    `;
  }

  static styles = css`
    :host {
      --pagination-dock-height: 72px;
      box-sizing: border-box;
      display: block;
      padding-bottom: var(--pagination-dock-height);
      width: 100%;
      overflow-x: hidden;
    }

    .padded {
      background: #23252a;
      margin: 1em;
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
      gap: 0.5em;
    }

    .search-options-label {
      text-transform: uppercase;
      font-weight: bold;
      color: var(--sl-color-neutral-500);
      padding-left: 0.25em;
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

    .banner {
      color: white;
      background-color: var(--sl-color-indigo-400);
      background-image: linear-gradient(to bottom right, var(--sl-color-indigo-400), var(--sl-color-indigo-300));
      position: relative;
      overflow: hidden;
    }
    .banner main {
      max-width: 65%;
      padding: 0.5em;
    }

    .banner main p {
      font-family: unset;
    }
    .banner aside {
      position: absolute;
      right: -68%;
      top: -35px;
      width: 100%;
      height: 128%;

      @media (min-width: 768px) {
        top: -65px;
        height: 180%;
      }

      @media (min-width: 1024px) {
        right: -55%;
        top: -165px;
        height: 280%;
      }
    }
    .banner aside img.doge-store-bg {
      height: 100%;
      width: auto;
      transform: rotate(-4deg);
    }

    .banner h1,
    .banner h2 {
      color: white;
      font-family: 'Comic Neue', sans-serif;
      margin: 0px;
    }
    .banner p:first-of-type {
      margin-top: 0px;
    }

    h1, h2 {
      font-family: 'Comic Neue', sans-serif;
      color: #ffd807;
    }

    header {
      display: flex;
      flex-direction: row;
      align-items: baseline;
      justify-content: space-between;
      gap: 0.8rem;
      margin: 1em 0em;
    }

    header .heading-wrap {
      display: flex;
      gap: 0.8rem;
      align-items: baseline;
      margin-bottom: 1em;
    }

    header .heading-wrap h2 {
      margin-top: 0px;
      @media (min-width: 1024px) {
        margin-top: 1em;
      }
    }

    header .header-actions {
      display: flex;
      flex-direction: row;
      gap: 0.85em;
      margin-left: auto;
    }

    /* Details toggle */
    .details-group pup-snapshot:not(:last-of-type),
    .details-group pup-snapshot-skeleton:not(:last-of-type) {
      margin-bottom: var(--sl-spacing-x-small);
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
  `
}

customElements.define('x-page-pup-library', LibraryView);
