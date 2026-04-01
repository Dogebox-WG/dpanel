import { LitElement, html, css, nothing } from "/vendor/@lit/all@3.1.2/lit-all.min.js";
import { store } from "/state/store.js";
import { StoreSubscriber } from "/state/subscribe.js";
import { jobWebSocket } from "/controllers/sockets/job-channel.js";

import "/components/views/x-log-viewer/index.js";

class SetupProgress extends LitElement {
  static properties = {
    jobId: { type: String },
    startErrorMessage: { type: String },
    onBack: { type: Object },
    onSuccess: { type: Object },
    onFailure: { type: Object },
    _failed: { type: Boolean },
    _errorMessage: { type: String },
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
      background-color: var(--sl-color-cyan-600);
      background-image: linear-gradient(
        to bottom right,
        var(--sl-color-cyan-600),
        var(--sl-color-sky-500)
      );
      position: relative;
      overflow: hidden;
    }

    .banner h1,
    .banner p {
      margin: 0;
    }

    .banner h1 {
      line-height: 1.1;
      margin-bottom: 0.75rem;
    }

    .banner p {
      line-height: 1.5;
      font-family: unset;
    }

    .log-wrap {
      border-radius: 12px;
      overflow: hidden;
    }

    x-log-viewer {
      --log-viewer-height: 420px;
      --log-footer-height: 56px;
    }

    .error-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      padding: 0.75rem 1rem;
      border-radius: 12px;
      background: rgba(255, 107, 107, 0.1);
      border: 1px solid var(--sl-color-danger-400);
    }

    .error-bar p {
      margin: 0;
      color: white;
      font-family: sans-serif;
      font-size: 0.9rem;
    }
  `;

  constructor() {
    super();
    this.jobId = "";
    this.startErrorMessage = "";
    this.onBack = null;
    this.onSuccess = null;
    this.onFailure = null;
    this._failed = false;
    this._errorMessage = "";
    this.context = new StoreSubscriber(this, store);
    this._completionHandled = false;
  }

  connectedCallback() {
    super.connectedCallback();
    jobWebSocket.connect();
    this._keepAlive = setInterval(() => {
      if (this._completionHandled || this._failed) return;
      jobWebSocket.connect();
    }, 10000);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    clearInterval(this._keepAlive);
  }

  updated(changedProperties) {
    if (changedProperties.has("jobId")) {
      this._completionHandled = false;
      this._failed = false;
      this._errorMessage = "";
    }

    const job = this._job;
    if (!job || this._completionHandled) {
      return;
    }

    if (job.status === "completed") {
      this._completionHandled = true;
      this.onSuccess && this.onSuccess();
    }

    if (job.status === "failed" || job.status === "cancelled") {
      this._completionHandled = true;
      this._failed = true;
      this._errorMessage =
        job.errorMessage || "Setup failed. Review the logs and try again.";
    }
  }

  get _job() {
    return store.jobsContext.jobs.find((job) => job.id === this.jobId) ?? null;
  }

  get _isFailed() {
    return Boolean(this.startErrorMessage) || this._failed;
  }

  get _activeErrorMessage() {
    return this.startErrorMessage || this._errorMessage;
  }

  handleBackClick = () => {
    if (this._isFailed) {
      this.onFailure && this.onFailure();
      return;
    }

    this.onBack && this.onBack();
  };

  render() {
    return html`
      <div class="page">
        <div class="banner">
          <h1>Setting up your Dogebox</h1>
          <p>
            ${this.jobId
              ? "This can take several minutes while Dogebox applies your network and system settings."
              : "Setup is starting now. Logs will appear here as soon as the backend begins streaming them."}
          </p>
        </div>

        <div class="log-wrap">
          <x-log-viewer
            .jobId=${this.jobId}
            ?connecting=${!this.jobId && !this._isFailed}
            ?reconnect=${true}
          ></x-log-viewer>
        </div>

        ${this._isFailed
          ? html`
              <div class="error-bar">
                <p>${this._activeErrorMessage}</p>
                <sl-button variant="primary" @click=${this.handleBackClick}>
                  Back
                </sl-button>
              </div>
            `
          : this.onBack
            ? html`
                <div style="display: flex; justify-content: flex-start;">
                  <sl-button variant="default" @click=${this.handleBackClick}>
                    Back
                  </sl-button>
                </div>
              `
            : nothing}
      </div>
    `;
  }
}

customElements.define("x-action-setup-progress", SetupProgress);
