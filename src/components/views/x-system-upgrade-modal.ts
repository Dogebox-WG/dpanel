import {
  LitElement,
  html,
  css,
  nothing,
} from "/lib/lit-all.js";
import { store } from "/state/store.js";
import { StoreSubscriber } from "/state/subscribe.js";
import { jobsController } from "/controllers/jobs/index.js";
import { isFailureJobStatus } from "/controllers/jobs/status.js";
import "/components/views/x-log-viewer/index.js";
import "/components/common/dbx-modal/index.js";

const outcomeHashes: Readonly<Record<string, string>> = Object.freeze({
  success: "#system-upgrade-success",
  error: "#system-upgrade-failed",
});

interface JobLike {
  id: string;
  status?: string;
  action?: string;
  started?: string;
  finished?: string | null;
}

class SystemUpgradeModal extends LitElement {
  declare activeJobId: string;
  declare activeJobStatus: string;
  declare trackedJobId: string;
  declare outcome: string;
  declare requestedBootstrapRefresh: boolean;

  context: StoreSubscriber;

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

    .content {
      display: flex;
      flex-direction: column;
      gap: 1rem;
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
    window.addEventListener("hashchange", this.handleHashChange);
    this.restoreFinishedStateFromHash();
  }

  disconnectedCallback() {
    window.removeEventListener("beforeunload", this.handleBeforeUnload);
    window.removeEventListener("hashchange", this.handleHashChange);
    jobsController.removeObserver(this);
    super.disconnectedCallback();
  }

  updated() {
    this.syncFinishedState();
    this.restoreFinishedStateFromHash();
    this.syncHashState();
  }

  onJobsUpdate(state?: { activeSystemUpdate?: JobLike | null }) {
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
    if (!this.trackedJobId) {
      return null;
    }

    return this.getSystemUpdateJobs().find((job) => job.id === this.trackedJobId) || null;
  }

  getSystemUpdateJobs() {
    const jobs = Array.isArray(this.context?.store?.jobsContext?.jobs)
      ? this.context.store.jobsContext.jobs
      : [];

    return jobs
      .filter((job) => (job?.action || "").toLowerCase() === "system-update")
      .sort((left, right) => {
        const leftTime = Date.parse(left?.finished || left?.started || "");
        const rightTime = Date.parse(right?.finished || right?.started || "");
        return rightTime - leftTime;
      });
  }

  parseOutcomeHash() {
    const hash = window.location.hash || "";

    for (const [outcome, prefix] of Object.entries(outcomeHashes)) {
      if (hash === prefix) {
        return { outcome, jobId: "" };
      }

      if (hash.startsWith(`${prefix}/`)) {
        return {
          outcome,
          jobId: decodeURIComponent(hash.slice(prefix.length + 1)),
        };
      }
    }

    return null;
  }

  buildOutcomeHash(outcome: string, jobId = "") {
    const prefix = outcomeHashes[outcome];
    if (!prefix) {
      return "";
    }

    return jobId ? `${prefix}/${encodeURIComponent(jobId)}` : prefix;
  }

  replaceHash(hash: string) {
    const nextUrl = `${window.location.pathname}${window.location.search}${hash}`;
    window.history.replaceState(window.history.state, "", nextUrl);
  }

  clearOutcomeHash() {
    if (!this.parseOutcomeHash()) {
      return;
    }

    this.replaceHash("");
  }

  shouldPreservePendingOutcomeHash() {
    return (
      Boolean(this.parseOutcomeHash()) &&
      this.context?.store?.jobsContext?.initialized !== true
    );
  }

  syncHashState() {
    if (this.isBlocking()) {
      this.clearOutcomeHash();
      return;
    }

    if (!this.trackedJobId || !this.outcome) {
      if (this.shouldPreservePendingOutcomeHash()) {
        return;
      }
      this.clearOutcomeHash();
      return;
    }

    const nextHash = this.buildOutcomeHash(this.outcome, this.trackedJobId);
    if (window.location.hash === nextHash) {
      return;
    }

    this.replaceHash(nextHash);
  }

  findHashTargetJob(outcome: string, jobId = "") {
    const systemUpdateJobs = this.getSystemUpdateJobs();
    const matchingStatus = outcome === "success"
      ? (job: JobLike) => job?.status === "completed"
      : (job: JobLike) => isFailureJobStatus(job?.status ?? "");

    if (jobId) {
      return systemUpdateJobs.find(
        (job) => job.id === jobId && matchingStatus(job),
      ) || null;
    }

    return systemUpdateJobs.find((job) => matchingStatus(job)) || null;
  }

  restoreFinishedStateFromHash() {
    if (this.isBlocking()) {
      return;
    }

    const hashState = this.parseOutcomeHash();
    if (!hashState) {
      return;
    }

    if (this.context?.store?.jobsContext?.initialized !== true) {
      return;
    }

    const targetJob = this.findHashTargetJob(hashState.outcome, hashState.jobId);
    if (!targetJob) {
      return;
    }

    if (
      this.trackedJobId === targetJob.id &&
      this.outcome === hashState.outcome
    ) {
      return;
    }

    this.trackedJobId = targetJob.id;
    this.outcome = hashState.outcome;
  }

  handleHashChange = () => {
    if (this.isBlocking()) {
      return;
    }

    const hashState = this.parseOutcomeHash();
    if (!hashState) {
      if (this.outcome) {
        this.trackedJobId = "";
        this.outcome = "";
        this.requestedBootstrapRefresh = false;
      }
      return;
    }

    this.restoreFinishedStateFromHash();
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

  handleBeforeUnload = (event: BeforeUnloadEvent) => {
    if (!this.isBlocking()) {
      return;
    }

    event.preventDefault();
    event.returnValue = "";
  };

  handleRequestClose = (event: Event) => {
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

    this.clearOutcomeHash();
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
        headline: "System upgrade in progress, do not power off your Dogebox.",
      };
    }

    if (this.outcome === "success") {
      return {
        headline: "System upgrade complete",
      };
    }

    return {
      headline: "System upgrade failed",
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
      <x-dbx-modal
        ?open=${open}
        title="System Upgrade"
        panel-width="920px"
        .dismissable=${!isBlocking}
        footerLabel=${!isBlocking ? "Dismiss" : ""}
        @dbx-close=${() => {
          if (!isBlocking) this.dismissFinishedModal();
        }}
        @dbx-footer-click=${() => this.dismissFinishedModal()}
      >
        <div slot="custom" class="content">
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
        </div>
      </x-dbx-modal>
    `;
  }
}

customElements.define("x-system-upgrade-modal", SystemUpgradeModal);
