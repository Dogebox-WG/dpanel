import { LitElement, html, nothing } from '/lib/lit-all.js';
import { bindToClass } from '/utils/class-bind.js'
import { asyncTimeout } from '/utils/timeout.js'
import { styles } from './pup-snapshot.styles.js';
import '/components/common/animated-dots.js'
import '/components/common/sparkline-chart/sparkline-chart.js'
import '/components/views/log-viewer/log-viewer.js'
import { pkgController } from '/controllers/package/index.js';
import { postConfig } from '/api/config/config.js';
import { createAlert } from '/components/common/alert.js';

// Import component chunks
import * as renderMethods from './renders/index.js';

/** sl-tab exposes its target panel name as an element property. */
interface SlTabEl extends HTMLElement { panel?: string }

/** sl-tab-group exposes an imperative show() method. */
interface SlTabGroupEl extends HTMLElement { show: (panel: string) => void }

export class PupSnapshot extends LitElement {

  // From manifest / state (see static properties below)
  declare pupId: string;
  declare pupName: string;
  declare version: string;
  declare icon: string;
  declare disabled: boolean;
  declare config: { sections?: unknown[] };
  // Note: a reactive `focus` property is also declared in static properties;
  // it shadows HTMLElement.focus() so it cannot be re-declared here.
  declare activeTab: string | null;
  declare installed: boolean;
  declare markInstalled: boolean;
  declare allowManage: boolean;
  declare docs: { about?: string } | undefined;
  declare running: boolean;
  declare stats: { cpu?: unknown; mem?: unknown; disk?: unknown };
  declare options: Record<string, unknown>;
  declare inspected: boolean;
  declare _dirty: number | boolean;
  declare _saved: boolean;

  // internal, non-reactive
  _status?: string;
  pkgController: typeof pkgController;
  allowInspect: boolean;
  gui?: unknown;
  loading?: boolean;
  router?: { go: (path: string | null) => void };
  _installed_dirty?: boolean;

  // Render chunks bound onto the instance via bindToClass(renderMethods, this)
  declare renderSummary: () => unknown;
  declare renderSummaryTitle: () => unknown;
  declare renderSummaryCharts: () => unknown;
  declare renderSummaryActions: () => unknown;
  declare renderSectionDesc: () => unknown;
  declare renderSectionScreens: () => unknown;
  declare renderSectionLogs: () => unknown;
  declare renderSectionStats: () => unknown;
  declare renderSectionConfig: () => unknown;
  // Handlers assigned within renderSummaryActions
  declare handleRunningAction: (event: Event, action: string) => Promise<void>;
  declare handleInstallAction: (event: Event, action: string) => Promise<void>;
  declare handleConfigureAction: (event: Event) => Promise<void>;
  declare handleLaunchAction: (event: Event) => void;

  static get properties() {
    return {
      // From manifest
      pupId: { type: String },
      pupName: { type: String },
      version: { type: String },
      icon: { type: String },
      disabled: { type: Boolean },
      config: { type: Object },
      focus: { type: String, reflect: true },
      activeTab: { type: String },
      installed: { type: Boolean },
      markInstalled: { type: Boolean },
      allowManage: { type: Boolean },
      docs: { type: Object },

      // From state
      status: { type: String },
      running: { type: Boolean },
      stats: { type: Object },
      options: { type: Object },
      inspected: { type: Boolean },

      // internal state
      _dirty: { type: Number, attribute: false },
      _saved: { type: Boolean, state: true }
    }
  }

  constructor() {
    super();
    this.stats = {}
    this.running = false;
    this.activeTab = null;
    this._dirty = 0;
    this.pkgController = pkgController;
    this.options = {};
    this.config = {};
    this.allowInspect = false;
    // Bind all imported renderMehtods to 'this'
    bindToClass(renderMethods, this)
  }

  get status() {
    return this._status;
  }

  set status(newStatus: string | undefined) {
    this._status = newStatus;
    this.running = newStatus === 'running';
    this.requestUpdate();
  }

  connectedCallback() {
    super.connectedCallback();
    this.pkgController.addObserver(this);
    // `composed` isn't a standard addEventListener option but is retained here to preserve existing behaviour.
    const listenerOptions: AddEventListenerOptions & { composed?: boolean } = { composed: true };
    this.addEventListener('form-dirty-change', this.handleDirtyChange.bind(this), listenerOptions)
    this.addEventListener('form-submit-success', this.handlePupUpdateSuccess.bind(this), listenerOptions)
  }

  firstUpdated() {
    const tabs = this.shadowRoot?.querySelectorAll('#PupTabs sl-tab') ?? [];
    tabs.forEach(tab => {
      tab.addEventListener('click', this.handleTabClick.bind(this));
    });
  }

  disconnectedCallback() {
    this.removeEventListener('form-dirty-change', this.handleDirtyChange.bind(this))
    this.removeEventListener('form-submit-success', this.handlePupUpdateSuccess.bind(this))
    this.pkgController.removeObserver(this);
    super.disconnectedCallback();
  }

  handleDirtyChange(event: Event) {
    if (event instanceof CustomEvent) {
      const detail: { dirty: number } = event.detail;
      this._dirty = detail.dirty;
    }
  }

  async handlePupUpdateSuccess() {
    // Celebrate successful update of pup config.
    this._saved = true;
    await asyncTimeout(2000)
    this._saved = false;
  }

  async handlePupConfigSubmitResponse(res: { error?: unknown } | null | undefined) {
    if (!res || res.error) {
      console.error('handlePupConfigSubmitResponse massive error', { res });
      return;
    }
  }

  submitConfig = async (
    stagedChanges: Record<string, unknown>,
    formNode: HTMLFormElement,
    dynamicForm: { commitChanges: (form: HTMLFormElement) => void; retainChanges: () => void },
  ) => {
    // prepare callbacks
    const callbacks = {
      onSuccess: () => dynamicForm.commitChanges(formNode),
      onError: (errorPayload?: unknown) => {
        // To cease the form from spinning
        dynamicForm.retainChanges();
        // Display a failure banner
        this.displayConfigUpdateErr(errorPayload)
      }
    }

    // invoke pkgContrller model update, supplying data and callbacks
    const res = await pkgController.requestPupChanges(this.pupId, stagedChanges, callbacks);

    if (res) {
      return true;
    }
  }

  displayConfigUpdateErr(failedTxnPayload: unknown) {
    const failedId =
      failedTxnPayload && typeof failedTxnPayload === 'object' && 'id' in failedTxnPayload && typeof failedTxnPayload.id === 'string'
        ? failedTxnPayload.id
        : undefined;
    const failedTxnId = failedId ? `(${failedId})` : '';
    createAlert('danger', ['Failed to update Pup configuration', `Refer to logs ${failedTxnId}`], 'exclamation-diamond');
    console.warn(`Doge is sad because ${failedTxnId}: `, failedTxnPayload)
  }

  handlePupTitleClick(e: Event) {
    e.stopPropagation();
    e.preventDefault();
  }

  handleTabClick(event: Event) {
    // Interupt tab change for a quick check whether there are
    // unsaved changes.
    event.stopPropagation();

    const target: SlTabEl | null = event.target instanceof HTMLElement ? event.target : null;
    const panel = target?.panel;

    // If not dirty, force tab change.
    if (!this._dirty) {
      this.jumpToTab(panel)
      return
    }

    // When dirty, ask the user if they want to stay or leave (abaonding changes)
    if (window.confirm("Do you really want to leave?")) {
      this.jumpToTab(panel)

      // Changes abandoned. Clear the dirt.
      this._dirty = false;
    }
  }

  jumpToTab(tabName: string | undefined) {
    // Emit forced-tab-show event
    this.dispatchEvent(new CustomEvent(
      'forced-tab-show', {
        detail: { tabName, pupId: this.pupId },
        bubbles: true,
        composed: true
      }
    ));

    // Reveal specific tab
    if (!tabName) return;
    this.activeTab = tabName;
    const tabGroup = this.shadowRoot?.querySelector<SlTabGroupEl>('sl-tab-group#PupTabs');
    tabGroup?.show(tabName);
  }

  render() {
    return html`
      <sl-details ?open=${this.allowInspect && this.inspected}>
        <div class="summary" slot="summary">
          ${this.renderSummary()}
        </div>
          <div class="content">
            <sl-tab-group
              id="PupTabs"
              style="--indicator-color: #07ffae;"
            >
              ${this.installed && !this.markInstalled ? html`
                ${this.renderSectionDesc()}
                ${this.renderSectionStats()}
                ${this.renderSectionLogs()}
                ${this.renderSectionConfig()}
                ${this.renderSectionScreens()}
              ` : nothing
              }

              ${!this.installed || this.markInstalled ? html`
                ${this.renderSectionDesc()}
                ${this.renderSectionScreens()}
              ` : nothing
              }
            </sl-tab-group>
          </div>
      </sl-details>
    `;
  }

  static styles = styles;
}

customElements.define('pup-snapshot', PupSnapshot);
