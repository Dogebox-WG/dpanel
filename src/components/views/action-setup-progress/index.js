import { LitElement, html, css } from "/vendor/@lit/all@3.1.2/lit-all.min.js";
import { store } from "/state/store.js";
import { StoreSubscriber } from "/state/subscribe.js";
import { jobWebSocket } from "/controllers/sockets/job-channel.js";

import "/components/views/x-log-viewer/index.js";

class SetupProgress extends LitElement {
  static properties = {
    jobId: { type: String },
    onSuccess: { type: Object },
    onFailure: { type: Object },
  };

  static styles = css`
    :host {
      display: block;
      font-family: "Comic Neue", sans-serif;
    }

    .page {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .banner {
      border-radius: 16px;
      padding: 1.5rem;
      color: white;
      background-color: var(--sl-color-yellow-500);
      background-image: linear-gradient(
        to bottom right,
        var(--sl-color-yellow-500),
        var(--sl-color-amber-600)
      );
    }

    .banner h1,
    .banner p {
      margin: 0;
    }

    .banner h1 {
      line-height: 1.1;
      margin-bottom: 0.75rem;
    }

    .status-card {
      border: 1px solid var(--sl-panel-border-color);
      border-radius: 16px;
      padding: 1rem;
      background: var(--sl-color-neutral-0);
    }

    .status-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
      margin-bottom: 0.75rem;
    }

    .status-copy h2,
    .status-copy p {
      margin: 0;
    }

    .status-copy h2 {
      font-size: 1.1rem;
      margin-bottom: 0.35rem;
    }

    .status-copy p {
      color: var(--sl-color-neutral-600);
      font-family: sans-serif;
    }

    .error-actions {
      display: flex;
      justify-content: flex-end;
      margin-top: 1rem;
    }

    x-log-viewer {
      --log-viewer-height: 360px;
      --log-footer-height: 56px;
      border-radius: 12px;
      overflow: hidden;
    }
  `;

  constructor() {
    super();
    this.jobId = "";
    this.onSuccess = null;
    this.onFailure = null;
    this.context = new StoreSubscriber(this, store);
    this._completionHandled = false;
  }

  connectedCallback() {
    super.connectedCallback();
    jobWebSocket.connect();
  }

  updated(changedProperties) {
    if (changedProperties.has("jobId")) {
      this._completionHandled = false;
    }

    const job = this._job;
    if (!job || this._completionHandled) {
      return;
    }

    if (job.status === "completed") {
      this._completionHandled = true;
      this.onSuccess && this.onSuccess();
    }
  }

  get _job() {
    return store.jobsContext.jobs.find((job) => job.id === this.jobId) ?? null;
  }

  get _statusVariant() {
    const status = this._job?.status;
    if (status === "failed" || status === "cancelled") return "danger";
    if (status === "completed") return "success";
    return "warning";
  }

  get _statusLabel() {
    const status = this._job?.status;
    if (status === "queued") return "Queued";
    if (status === "in_progress") return "In Progress";
    if (status === "failed") return "Failed";
    if (status === "cancelled") return "Cancelled";
    if (status === "completed") return "Completed";
    return "Preparing";
  }

  get _statusMessage() {
    const job = this._job;
    if (!this.jobId) {
      return "Waiting for the setup job to start.";
    }
    if (!job) {
      return "Connecting to the setup job and loading logs.";
    }
    if (job.status === "failed" || job.status === "cancelled") {
      return job.errorMessage || "Setup failed. Review the logs and try again.";
    }
    if (job.status === "completed") {
      return "Setup finished successfully. Continuing to the next step.";
    }
    return job.summaryMessage || "Your Dogebox is applying the selected settings.";
  }

  handleBackClick = () => {
    this.onFailure && this.onFailure();
  };

  render() {
    const job = this._job;
    const isFailed = job?.status === "failed" || job?.status === "cancelled";

    return html`
      <div class="page">
        <div class="banner">
          <h1>Setting up your Dogebox</h1>
          <p>
            This can take several minutes while Dogebox applies your network and
            system settings.
          </p>
        </div>

        <div class="status-card">
          <div class="status-head">
            <div class="status-copy">
              <h2>${job?.displayName || "Initial Setup"}</h2>
              <p>${this._statusMessage}</p>
            </div>
            <sl-tag variant=${this._statusVariant} size="large">
              ${this._statusLabel}
            </sl-tag>
          </div>

          ${job
            ? html`
                <x-log-viewer .jobId=${this.jobId}></x-log-viewer>
              `
            : html`
                <sl-alert variant="warning" open>
                  <sl-icon slot="icon" name="hourglass-split"></sl-icon>
                  Waiting for the setup log stream.
                </sl-alert>
              `}

          ${isFailed
            ? html`
                <div class="error-actions">
                  <sl-button variant="primary" @click=${this.handleBackClick}>
                    Go Back
                  </sl-button>
                </div>
              `
            : ""}
        </div>
      </div>
    `;
  }
}

customElements.define("x-action-setup-progress", SetupProgress);
