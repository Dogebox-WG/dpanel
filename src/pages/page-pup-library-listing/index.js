import {
  LitElement,
  html,
  css,
  nothing,
  choose,
  unsafeHTML,
  classMap,
} from "/vendor/@lit/all@3.1.2/lit-all.min.js";
import "/components/common/action-row/action-row.js";
import "/components/common/dynamic-form/dynamic-form.js";
import "/components/views/x-check/index.js";
import "/components/common/page-container.js";
import "/components/common/sparkline-chart/sparkline-chart-v2.js";
import "/components/views/x-metric/metric.js";
import "/components/views/x-activity-log.js";
import "/components/common/reveal-row/reveal-row.js";
import "/components/views/x-version-card.js";
import "/components/views/x-launcher-button/index.js";
import "/components/views/x-log-viewer/index.js";
import { bindToClass } from "/utils/class-bind.js";
import * as renderMethods from "./renders/index.js";
import { store } from "/state/store.js";
import { StoreSubscriber } from "/state/subscribe.js";
import { pkgController } from "/controllers/package/index.js";
import { pupUpdates } from "/state/pup-updates.js";
import { asyncTimeout } from "/utils/timeout.js";
import { createAlert } from "/components/common/alert.js";
import { doBootstrap } from "/api/bootstrap/bootstrap.js";
import { renderDialog } from "./renders/dialog.js";
import { renderActions } from "./renders/actions.js";
import { renderStatus } from "./renders/status.js";

class PupPage extends LitElement {
  static get properties() {
    return {
      ready: { type: Boolean }, // Page is loading or not.
      result: { type: String }, // 200, 404, 500.
      open_dialog: { type: Boolean },
      open_dialog_label: { type: String },
      checks: { type: Object },
      pupEnabled: { type: Boolean },
      _confirmedName: { type: String },
      inflight_startstop: { type: Boolean },
      inflight_uninstall: { type: Boolean },
      inflight_purge: { type: Boolean },
      activityLogs: { type: Array },
      rollbackAvailable: { type: Boolean },
    };
  }

  constructor() {
    super();
    bindToClass(renderMethods, this);
    this.pkgController = pkgController;
    this.context = new StoreSubscriber(this, store);
    this.open_dialog = "";
    this.open_dialog_label = "";
    this.open_page = false;
    this.open_page_label = "";
    this.checks = [];
    this.pupEnabled = false;
    this._confirmedName = "";
    this.activityLogs = [];
    this.rollbackAvailable = false;
    this.renderDialog = renderDialog.bind(this);
    this.renderActions = renderActions.bind(this);
    this.renderStatus = renderStatus.bind(this);
    this._missingPupRedirectTimer = null;
  }

  getPup() {
    return this.pkgController.getPupMaster({ 
      pupId: this.context.store.pupContext?.state?.id,
      lookupType: "byStatePupId"
    }).pup
  }

  connectedCallback() {
    super.connectedCallback();
    this.pkgController.addObserver(this);
  }

  disconnectedCallback() {
    this.pkgController.removeObserver(this);
    if (this._missingPupRedirectTimer) {
      clearTimeout(this._missingPupRedirectTimer);
      this._missingPupRedirectTimer = null;
    }
    super.disconnectedCallback();
  }

  requestUpdate(options = {}) {
    if (this.pkgController && options.type === 'activity') {
      if (this.context.store.pupContext?.state?.id) {
        this.updateActivityLogs();
      }
    }
    super.requestUpdate();
  }

  updateActivityLogs() {
    const pupId = this.context.store.pupContext?.state?.id
    const logs = this.pkgController.activityIndex[pupId];
    this.activityLogs = Array.isArray(logs) ? [...logs] : [];
  }

  renderLogViewer(pkg) {
    if (!pkg?.state?.id) return nothing;
    
    // Check if there's a recent job (active or recently completed) for this pup
    const recentJob = this.pkgController.getRecentJobForPup(pkg.state.id);
    
    // Always use x-log-viewer when there's a job - provides consistent, detailed logs
    if (recentJob) {
      return html`
        <x-log-viewer 
          .jobId=${recentJob.id}
          autostart
        ></x-log-viewer>
      `;
    }
    
    return nothing;
  }

  async firstUpdated() {
    this.addEventListener("sl-hide", this.handleDialogClose);
  }

  handleDialogClose() {
    this.clearDialog();
  }

  clearDialog() {
    this.open_dialog = false;
    this.open_dialog_label = "";
  }

  handleMenuClick = (event, el) => {
    this.open_dialog = el.getAttribute("name");
    this.open_dialog_label = el.getAttribute("label");
  };

  submitConfig = async (stagedChanges, formNode, dynamicForm) => {
    // Define callbacks
    const pupId = this.context.store.pupContext.state.id
    const callbacks = {
      onSuccess: () => dynamicForm.commitChanges(formNode),
      onError: (errorPayload) => {
        dynamicForm.retainChanges();
        this.displayConfigUpdateErr(errorPayload);
      },
    };

    const res = await pkgController.requestPupChanges(
      pupId,
      stagedChanges,
      callbacks,
    );
    if (res && !res.error) {
      return true;
    }
  };

  displayConfigUpdateErr(failedTxnPayload) {
    const failedTxnId = failedTxnPayload?.id ? `(${failedTxnPayload.id})` : "";
    const message = [
      "Failed to update configuration",
      `Refer to logs ${failedTxnId}`,
    ];
    const action = { text: "View details" };
    const err = new Error(failedTxnPayload.error);
    const hideAfter = 0;

    createAlert(
      "danger",
      message,
      "exclamation-diamond",
      hideAfter,
      action,
      err,
    );
  }

  async handleStartStop(e) {
    const pupId = this.context.store.pupContext.state.id
    this.inflight_startstop = true;
    this.pupEnabled = e.target.checked;
    this.requestUpdate();

    const actionName = e.target.checked ? 'start' : 'stop' ;
    const callbacks = {
      onSuccess: () => { this.inflight_startstop = false; },
      onError: () => { console.warning('Txn reported an error'); this.inflight_startstop = false; },
      onTimeout: () => { console.log('Slow txn, no repsonse within ~30 seconds (start/stop)', ); this.inflight_startstop = false; }
    }
    await this.pkgController.requestPupAction(pupId, actionName, callbacks);
  }

  async handleUninstall(e) {
    const pupId = this.context.store.pupContext.state.id
    this.pupEnabled = false;
    this.inflight_uninstall = true;
    this.requestUpdate();

    // Clear update info immediately to prevent stale cache on page refresh
    pupUpdates.clearUpdateInfo(pupId);

    const actionName = 'uninstall'
    const callbacks = {
      onSuccess: async () => {
        await doBootstrap();
        this.inflight_uninstall = false;
        // After uninstall, the current /pups/:id/:name route may no longer be meaningful.
        // Navigate to the library page to avoid a blank page.
        window.location.href = window.location.origin + "/pups";
      },
      onError: async () => {
        await doBootstrap();
        this.inflight_uninstall = false;
      },
      onTimeout: async () => {
        await doBootstrap();
        this.inflight_uninstall = false;
      }
    }
    await this.pkgController.requestPupAction(pupId, actionName, callbacks);

    this._confirmedName = "";
    this.clearDialog();
  }

  handleUpgradeStarted(e) {
    // Close the dialog and show a message
    this.clearDialog();
    createAlert('neutral', `Upgrading ${this.context.store.pupContext.state.manifest.meta.name}...`, 'arrow-up-circle', 3000);
  }

  handleUpdateSkipped(e) {
    // Close the dialog
    this.clearDialog();
  }

  get hasUpdate() {
    const pupId = this.context.store.pupContext?.state?.id;
    if (!pupId) return false;
    return pupUpdates.hasUpdate(pupId);
  }

  async updated(changedProperties) {
    super.updated(changedProperties);
    
    // Check for rollback availability when pup becomes broken
    const pkg = this.getPup();
    if (pkg && pkg.state.installation === 'broken') {
      await this.checkRollbackAvailability();
    }

    // If we're still on a pup route but the pup disappeared (purged),
    // avoid returning a blank page by redirecting back to the library listing.
    const pupContext = this.context.store?.pupContext;
    // Allow pkgController.notify(pupId, ...) to target this page.
    if (pupContext?.state?.id && this.pupId !== pupContext.state.id) {
      this.pupId = pupContext.state.id;
    }
    // Only redirect if:
    // 1. Bootstrap succeeded (result === 200)
    // 2. We have a valid pup ID in the route
    // 3. The pup is genuinely missing from memory
    if (pupContext?.ready && pupContext?.result === 200 && pupContext?.state?.id && !pkg) {
      if (!this._missingPupRedirectTimer) {
        console.warn("[PupPage] pup missing for current route; redirecting to /pups", {
          routePupId: pupContext.state.id,
        });
        this._missingPupRedirectTimer = setTimeout(() => {
          window.location.href = window.location.origin + "/pups";
        }, 750);
      }
    } else if (pkg && this._missingPupRedirectTimer) {
      clearTimeout(this._missingPupRedirectTimer);
      this._missingPupRedirectTimer = null;
    }
  }

  async checkRollbackAvailability() {
    const pupId = this.context.store.pupContext?.state?.id;
    if (!pupId) return;
    
    try {
      const { getPreviousVersion } = await import('/api/pup-updates/pup-updates.js');
      const result = await getPreviousVersion(pupId);
      this.rollbackAvailable = result.rollbackPossible || false;
    } catch (error) {
      console.error('Failed to check rollback availability:', error);
      this.rollbackAvailable = false;
    }
  }

  render() {
    const pupContext = this.context.store?.pupContext

    if (!pupContext.ready) {
      return html`
      <div id="PageWrapper" class="wrapper">
        <section>
          <div class="section-title">
            <h3>Status &nbsp;<sl-spinner style="position: relative; top: 3px;"></sl-spinner></h3>
          </div>
          <!-- TODO More Skeleton -->
        </section>
      </div>`
    }

    if (pupContext.result !== 200) {
      return html`
      <div id="PageWrapper" class="wrapper">
        <section>
          <div class="section-title">
            <h3>Such Empty</h3>
            <p>Nothing to see here</p>
            <!-- TODO Specific error handling -->
          </div>
        </section>
      </div>`
    }

    const path = this.context.store?.appContext?.path || [];
    const pkg = this.getPup();

    if (!pkg) {
      // This can happen after purge/uninstall if the backend has removed the pup
      // but the user is still on the old route.
      return html`
        <div id="PageWrapper" class="wrapper">
          <section>
            <div class="section-title">
              <h3>Such Empty</h3>
              <p>This pup no longer exists. Redirecting…</p>
            </div>
          </section>
        </div>
      `;
    }

    const hasChecks = (pkg.state.manifest?.checks || []).length > 0;

    let labels = { ...(pkg?.computed || {}) }
    let isInstallationLoadingStatus =  ["installing", "upgrading", "uninstalling", "purging"].includes(labels.installationId);
    let statusInstallationId = labels.installationId === "ready" ? labels.statusId : labels.installationId
    const isLoadingStatus =  ["starting", "stopping"].includes(labels.statusId);
    const disableActions = labels.installationId === "uninstalled";
    const isRunning = labels.statusId === "running";

    // descriptions
    const short = pkg?.state?.manifest?.meta?.shortDescription || '';
    const long = pkg?.state?.manifest?.meta?.longDescription || ''

    const logo = pkg?.assets?.logos?.mainLogoBase64

    const renderHealthChecks = () => {
      return this.checks.map(
        (check) => html`
          <health-check status=${check.status} .check=${check} ?disabled=${!this.pupEnabled || disableActions}></health-check>
        `,
      );
    };

    const renderStats = () => {
      if (pkg.stats.metrics.length === 0) {
        return html`
          <div class="metrics-wrap">
            <small style="font-family: 'Comic Neue'; color: var(--sl-color-neutral-600);">Such empty. Pup reports no metrics</small>
          </div>
        `;
      }

      const manifestList = pkg.state.manifest?.metrics ?? [];

      const defsByName = new Map(
        manifestList
          .filter((m) => m.name?.trim())
          .map((m) => [String(m.name).trim().toLowerCase(), m])
      );

      const enriched = (pkg.stats.metrics || []).map((m) => {
        const matchedDef = defsByName.get(String(m.name || '').trim().toLowerCase());
        const desc = (matchedDef?.description?.trim?.() || "");
        return { ...m, description: desc };
      });

      return html`
        <div class="metrics-wrap">
          ${enriched.map(
            (metric) => html`
              <div class="metric-container">
                <div
                  class="metric-label"
                  title=${(metric.description ||
                  metric.label ||
                  metric.name ||
                  "").trim()}
                >
                  ${metric.label ?? metric.name ?? ""}
                </div>
                <x-metric .metric=${metric}></x-metric>
              </div>
            `,
          )}
        </div>
      `;
    };

    const renderResources = () => {
      if (pkg.stats.systemMetrics.length === 0) {
        return html`
          <div class="metrics-wrap">
            <p class="no-metrics">No resource metrics available</p>
          </div>
        `;
      }

      return html`
        <div class="metrics-wrap">
          ${pkg.stats.systemMetrics.map(
            (metric) => html`
              <div class="metric-container">
                <div
                  class="metric-label"
                  title=${(metric.description ||
                  metric.label ||
                  metric.name ||
                  "").trim?.() || ""}
                >
                  ${metric.label ?? metric.name ?? ""}
                </div>
                <x-metric .metric=${metric}></x-metric>
              </div>
            `,
          )}
        </div>
      `;
    };

    const renderMenu = () => html`
      <action-row prefix="power" name="state" label="Enabled" ?disabled=${disableActions}>
        Enable or disable this Pup
        <sl-switch slot="suffix" ?checked=${!disableActions && pkg.state.enabled} @sl-input=${this.handleStartStop} ?disabled=${this.inflight_startstop || labels.installationId !== "ready"}></sl-switch>
      </action-row>

      <action-row prefix="gear" name="configure" label="Configure" .trigger=${this.handleMenuClick} ?disabled=${disableActions} ?dot=${labels.statusId === 'needs_config'}>
        Customise ${pkg.state.manifest.meta.name}
      </action-row>

      <action-row prefix="arrow-up-circle" name="update" label="Updates" .trigger=${this.handleMenuClick} ?dot=${this.hasUpdate}>
        ${this.hasUpdate 
          ? html`A new version of ${pkg.state.manifest.meta.name} is available`
          : html`<small>No updates available.</small>`
        }
      </action-row>

      <!--action-row prefix="archive-fill" name="properties" label="Properties" .trigger=${this.handleMenuClick} ?disabled=${disableActions}>
        Ea sint dolor commodo.
      </action-row-->

      <!--action-row prefix="lightning-charge" name="actions" label="Actions" .trigger=${this.handleMenuClick} ?disabled=${disableActions}>
        Ea sint dolor commodo.
      </action-row-->

      <action-row prefix="display" name="logs" label="Logs" href="${window.location.pathname}/logs" ?disabled=${disableActions}>
        Unfiltered logs
      </action-row>
    `;

    const renderMore = () => html`
      ${nothing || html`
        <action-row prefix="list-ul" name="readme" label="Read me" .trigger=${this.handleMenuClick}>
          Many info
        </action-row>
      `}

      <action-row prefix="boxes" name="deps" label="Dependencies" .trigger=${this.handleMenuClick} ?dot=${labels.statusId === 'needs_deps'}>
        Functionality this pup depends on from other pups.
      </action-row>

      <action-row prefix="box-arrow-up" name="ints" label="Interfaces" .trigger=${this.handleMenuClick}>
        Functionality this pup provides for other pups.
      </action-row>
    `

    const renderCareful = () => html`
      <action-row prefix="trash3-fill" name="uninstall" label="Uninstall" .trigger=${this.handleMenuClick} ?disabled=${disableActions}>
        Remove this pup from your system
      </action-row>
    `

    const sectionTitleClasses = classMap({
      "section-title": true,
      "disabled": disableActions
    })

    const hasLogs = this.activityLogs.length

    if (this.context.store?.networkContext?.logPupDerivations) {
      // eslint-disable-next-line no-console
      console.log("[PupPage] derive", {
        routePupId: pupContext?.state?.id,
        pkgId: pkg?.state?.id,
        pkgFound: !!pkg,
        installation: pkg?.state?.installation,
        enabled: pkg?.state?.enabled,
        statsStatus: pkg?.stats?.status,
        computed: {
          installationId: labels.installationId,
          statusId: labels.statusId,
        },
        ui: {
          inflight_startstop: this.inflight_startstop,
          inflight_uninstall: this.inflight_uninstall,
          inflight_purge: this.inflight_purge,
        },
      });
    }

    return html`
      <div id="PageWrapper" class="wrapper">
        <section>
          <div style="display:flex; flex-direction: row; gap: 1em; margin-bottom: 6px;">
            ${logo ? html`<img style="width: 91px; height: 91px;" src="${logo}" />` : nothing}
            <div style="display: flex; flex-direction: column; width: 100%;">
              <div class="section-title">
                <h3>Status</h3>
              </div>
              ${this.renderStatus(labels, pkg, this.rollbackAvailable)}
              <sl-progress-bar value="0" ?indeterminate=${isLoadingStatus || isInstallationLoadingStatus} class="loading-bar ${statusInstallationId}"></sl-progress-bar>
            </div>
          </div>
          ${this.renderLogViewer(pkg)}
          ${this.renderActions(labels, hasLogs)}
        </section>

        ${isRunning ? html`
        <section>
          <div class=${sectionTitleClasses}>
            <h3>Stats</h3>
          </div>
          ${renderStats()}
        </section>
        ` : nothing }

        <section>
          <div class=${sectionTitleClasses}>
            <h3>About</h3>
          </div>
          <reveal-row style="margin-top:-1em;">
            ${long
              ? html`<p>${long}</p>`
              : html`<small style="font-family: 'Comic Neue'; color: var(--sl-color-neutral-600);">Such empty, no description.</small>`
            }
          </reveal-row>
        </section>

        <section>
          <div class=${sectionTitleClasses}>
            <h3>Menu</h3>
          </div>
          <div class="list-wrap">${renderMenu()}</div>
        </section>

        ${hasChecks ? html`
        <section>
          <div class=${sectionTitleClasses}>
            <h3>Health checks</h3>
          </div>
          <div class="list-wrap">${renderHealthChecks()}</div>
        </section>`
        : nothing }

        <section>
          <div class="section-title">
            <h3>Such More</h3>
          </div>
          <div class="list-wrap">${renderMore()}</div>
        </section>

        ${isRunning ? html`
        <section>
          <div class=${sectionTitleClasses}>
            <h3>Resources</h3>
          </div>
          ${renderResources()}
        </section>
        `: nothing }

        <section>
          <div class="section-title">
            <h3>Much Care</h3>
          </div>
          <div class="list-wrap">${renderCareful()}</div>
        </section>
      </div>

      <aside>
        <sl-dialog
          class="distinct-header"
          id="PupMgmtDialog"
          ?open=${this.open_dialog}
          label=${this.open_dialog_label}
        >
          ${this.renderDialog()}
        </sl-dialog>
      </aside>
    `;
  }

  static styles = css`
    :host {
      position: relative;
      display: block;
      --indi: #777;
    }

    .wrapper {
      display: block;
      padding: 2em;
      position: relative;
    }

    .wrapper[data-freeze] {
      overflow: hidden;
    }

    h1,
    h2,
    h3 {
      margin: 0;
      padding: 0;
    }

    section {
      margin-bottom: 2em;
    }

    section div {
      margin-bottom: 1em;
    }

    section .section-title {
      margin-bottom: 0em;
      display: flex;
      align-items: center;
      gap: 0.75em;
    }

    section .section-title.disabled {
      color: var(--sl-color-neutral-400);
    }

    .update-badge {
      font-family: 'Comic Neue';
      font-weight: bold;
    }

    section div.underscored {
      border-bottom: 1px solid #333;
    }

    aside.page-popver[data-open] {
      display: block;
    }

    sl-dialog.distinct-header::part(header) {
      z-index: 960;
      background: rgb(24, 24, 24);
    }


    .loading-bar {
      --height: 1px;
      --track-color: #444;
      --indicator-color: #999;
      &.installing { --indicator-color: var(--sl-color-primary-600); }
      &.starting { --indicator-color: var(--sl-color-primary-600); }
      &.stopping { --indicator-color: var(--sl-color-danger-600); }
      &.upgrading { --indicator-color: var(--sl-color-primary-600); }
      &.uninstalling { --indicator-color: var(--sl-color-danger-600); }
      &.purging { --indicator-color: var(--sl-color-danger-600); }
    }

    .metrics-wrap {
      margin-top: .5em;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: 1.5em;
      width: 100%;
      align-items: stretch;
      grid-auto-rows: minmax(var(--sparkline-height, 160px), auto);
    }

    .metric-container {
      min-width: 0;
      min-height: 0;
      display: flex;
      flex-direction: column;
      border-radius: 8px;
      padding: 1em;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
      overflow: hidden;
    }

    .metric-container > x-metric {
      display: block;
      height: 100%;
      width: 100%;
    }

    .metric-label {
      font-size: 0.9rem;
      font-weight: 600;
      color: #07ffae;
      margin: 0 0 0.35rem 0;
      user-select: text;
      pointer-events: auto;
    }
  `;
}

customElements.define("x-page-pup-library-listing", PupPage);
