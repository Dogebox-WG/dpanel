import { LitElement, html, css, nothing, repeat } from '/vendor/@lit/all@3.1.2/lit-all.min.js';
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
    inspectedPup: { type: String }
  }

  constructor() {
    super();
    this.busy = false;
    this.busyQueue = [];
    this.fetchLoading = true;
    this.fetchError = false;
    this.itemsPerPage = 20;
    this.pkgController = pkgController;
    this.installedList = new PaginationController(this, undefined, this.itemsPerPage, { initialSort });
    // this.availableList = new PaginationController(this, undefined, this.itemsPerPage);
    this.inspectedPup;
    bindToClass(renderMethods, this);
  }

  connectedCallback() {
    super.connectedCallback();
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

  updatePups() {
    if (!this.fetchLoading && !this.fetchError) {
      this.installedList.setData(this.pkgController.pups.filter(p => p.state));
    }
  }

  async fetchBootstrap() {
    this.reset();
    // Emit busy start event which adds this action to a busy-queue.
    this.dispatchEvent(new CustomEvent('busy-start', {}));

    try {
      const res = await getBootstrapV2()
      this.pkgController.setData(res);
      this.installedList.setData(this.pkgController.pups.filter(p => p.state));
    } catch (err) {
      console.error(err);
      this.fetchError = true;
    } finally {
      // Emit a busy stop event which removes this action from the busy-queue.
      this.dispatchEvent(new CustomEvent('busy-stop', {}));
      this.fetchLoading = false
    }
  }

  handleActionsMenuSelect(event) {
    const selectedItemValue = event.detail.item.value;
    switch (selectedItemValue) {
      case 'refresh':
        this.fetchBootstrap();
        break;
    }
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

    return html`
      <div class="padded">
        ${this.fetchLoading 
          ? html`<sl-spinner style="--indicator-color:#777;"></sl-spinner>
        ` : this.renderSectionInstalledBody(ready, SKELS, hasItems) }
      </div>

    `;
  }

  static styles = css`
    :host {
      display: block;
      width: 100%;
      overflow-x: hidden;
    }

    .padded {
      background: #23252a;
      margin: 1em;
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
