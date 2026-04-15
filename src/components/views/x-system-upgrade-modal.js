import {
  LitElement,
  html,
  css,
  nothing,
} from "/vendor/@lit/all@3.1.2/lit-all.min.js";
import { store } from "/state/store.js";
import { StoreSubscriber } from "/state/subscribe.js";
import { jobsController } from "/controllers/jobs/index.js";
import { isFailureJobStatus } from "/controllers/jobs/status.js";
import "/components/views/x-log-viewer/index.js";

class SystemUpgradeModal extends LitElement {
  static properties = {
    activeJobId: { type: String },
    activeJobStatus: { type: String },
    trackedJobId: { type: String },
    outcome: { type: String },
    requestedBootstrapRefresh: { type: Boolean },
  };

  static styles = css`
    :host {
      display: block;
    }

    sl-dialog::part(panel) {
      width: min(920px, 96vw);
    }

    .content {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    h2 {
      margin: 0;
      font-family: "Comic Neue", sans-serif;
    }

    p {
      margin: 0;
      color: #666;
      line-height: 1.4;
    }

    x-log-viewer {
      --log-viewer-height: 320px;
      --log-footer-height: 56px;
    }

    .actions {
      display: flex;
      justify-content: flex-end;
    }
  `;

  constructor() {
    super();
    this.context = new StoreSubscriber(this, store);
    const activeSystemUpdate = jobsController.getActiveSystemUpdate();
    this.activeJobId = activeSystemUpdate?.id || "";
    this.activeJobStatus = activeSystemUpdate?.status || "";
    this.trackedJobId = this.activeJobId;
    this.outcome = "";
    this.requestedBootstrapRefresh = false;
  }

  connectedCallback() {
    super.connectedCallback();
    jobsController.addObserver(this);
    window.addEventListener("beforeunload", this.handleBeforeUnload);
  }

  disconnectedCallback() {
    window.removeEventListener("beforeunload", this.handleBeforeUnload);
    jobsController.removeObserver(this);
    super.disconnectedCallback();
  }

  updated() {
    this.syncFinishedState();
  }

  onJobsUpdate(state) {
    const activeSystemUpdate = state?.activeSystemUpdate || null;
    const nextActiveJobId = activeSystemUpdate?.id || "";
    const nextActiveJobStatus = activeSystemUpdate?.status || "";

    if (nextActiveJobId) {
      if (nextActiveJobId !== this.trackedJobId) {
        this.trackedJobId = nextActiveJobId;
        this.outcome = "";
        this.requestedBootstrapRefresh = false;
      }
      this.activeJobId = nextActiveJobId;
      this.activeJobStatus = nextActiveJobStatus;
      return;
    }

    this.activeJobId = "";
    this.activeJobStatus = "";
    this.syncFinishedState();
  }

  getTrackedJob() {
    const jobs = Array.isArray(this.context?.store?.jobsContext?.jobs)
      ? this.context.store.jobsContext.jobs
      : [];

    if (!this.trackedJobId) {
      return null;
    }

    return jobs.find((job) => job.id === this.trackedJobId) || null;
  }

  syncFinishedState() {
    if (this.activeJobId || !this.trackedJobId || this.outcome) {
      return;
    }

    const trackedJob = this.getTrackedJob();
    if (!trackedJob) {
      return;
    }

    if (isFailureJobStatus(trackedJob.status)) {
      this.outcome = "error";
      return;
    }

    if (trackedJob.status === "completed") {
      this.outcome = "success";
      this.requestBootstrapRefresh();
    }
  }

  requestBootstrapRefresh() {
    if (this.requestedBootstrapRefresh) {
      return;
    }

    this.requestedBootstrapRefresh = true;
    this.dispatchEvent(new CustomEvent("refresh-bootstrap-request", {
      bubbles: true,
      composed: true,
    }));
  }

  isBlocking() {
    return Boolean(this.activeJobId);
  }

  handleBeforeUnload = (event) => {
    if (!this.isBlocking()) {
      return;
    }

    event.preventDefault();
    event.returnValue = "";
  };

  handleRequestClose = (event) => {
    event.preventDefault();

    if (this.isBlocking()) {
      return;
    }

    this.dismissFinishedModal();
  };

  dismissFinishedModal() {
    if (this.isBlocking()) {
      return;
    }

    this.trackedJobId = "";
    this.outcome = "";
    this.requestedBootstrapRefresh = false;
  }

  getAlertVariant() {
    if (this.isBlocking()) {
      return "warning";
    }

    return this.outcome === "success" ? "success" : "danger";
  }

  getStatusCopy() {
    if (this.isBlocking()) {
      return {
        headline: "System upgrade in progress",
        body: "Do not power off your Dogebox while the upgrade is running.",
      };
    }

    if (this.outcome === "success") {
      return {
        headline: "System upgrade complete",
        body: "The system upgrade finished successfully.",
      };
    }

    return {
      headline: "System upgrade failed",
      body: "The system upgrade did not complete successfully.",
    };
  }

  render() {
    const open = this.isBlocking() || Boolean(this.trackedJobId && this.outcome);
    if (!open) {
      return nothing;
    }

    const copy = this.getStatusCopy();
    const isBlocking = this.isBlocking();

    return html`
      <sl-dialog
        no-header
        ?open=${open}
        @sl-request-close=${this.handleRequestClose}
      >
        <div class="content">
          <h2>System Upgrade</h2>
          <p>${copy.body}</p>

          <sl-alert open variant=${this.getAlertVariant()}>
            <small>${copy.headline}</small>
            ${isBlocking
              ? html`<sl-progress-bar indeterminate></sl-progress-bar>`
              : html`<sl-progress-bar value="100"></sl-progress-bar>`}
          </sl-alert>

          ${this.trackedJobId
            ? html`<x-log-viewer
                .jobId=${this.trackedJobId}
                autostart
                .autoReconnect=${true}
              ></x-log-viewer>`
            : nothing}

          ${!isBlocking
            ? html`
                <div class="actions">
                  <sl-button variant="primary" @click=${this.dismissFinishedModal}>
                    Dismiss
                  </sl-button>
                </div>
              `
            : nothing}
        </div>
      </sl-dialog>
    `;
  }
}

customElements.define("x-system-upgrade-modal", SystemUpgradeModal);
