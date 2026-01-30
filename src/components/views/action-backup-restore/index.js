import { LitElement, html, css, nothing } from "/vendor/@lit/all@3.1.2/lit-all.min.js";
import { classMap } from "/vendor/@lit/all@3.1.2/lit-all.min.js";
import {
  getRemovableMounts,
  startBackup,
  startRestoreFromPath,
  uploadRestore,
  downloadBackup,
} from "/api/system/backup.js";
import { getJob } from "/api/jobs/jobs.js";

class BackupRestoreAction extends LitElement {
  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      align-items: stretch;
      padding: 1em;
      width: 100%;
      max-width: 520px;
      margin: 0 auto;
      box-sizing: border-box;
    }
    .modal-title {
      font-family: "Comic Neue", sans-serif;
      font-size: 1.6em;
      font-weight: bold;
      margin-bottom: 0.75em;
      color: var(--sl-color-neutral-900);
      text-align: center;
    }
    .intro-text {
      margin-bottom: 1.5em;
      line-height: 1.5;
      text-align: center;
    }
    .card-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 1em;
      margin: 1.5em 0;
      width: 100%;
    }
    @media (max-width: 700px) {
      :host {
        min-width: unset;
      }
      .card-grid {
        grid-template-columns: 1fr;
      }
    }
    .card {
      min-height: 150px;
      width: 100%;
      background: var(--sl-panel-background-color);
      border: 1px solid var(--sl-panel-border-color);
      border-radius: var(--sl-border-radius-medium);
      padding: 1em;
      box-sizing: border-box;
      display: flex;
      align-items: flex-start;
      gap: 1em;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .card:hover {
      border-color: var(--sl-color-primary-500);
      box-shadow: 0 0 0 1px var(--sl-color-primary-500);
    }
    .card.selected {
      border-color: var(--sl-color-primary-500);
      background-color: var(--sl-color-primary-50);
      box-shadow: 0 0 0 var(--sl-focus-ring-width) var(--sl-input-focus-ring-color);
    }
    .card-icon {
      width: 64px;
      height: 64px;
      min-width: 64px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--sl-color-neutral-100);
      border-radius: var(--sl-border-radius-small);
      color: var(--sl-color-neutral-700);
    }
    .card > div {
      min-width: 0;
    }
    .card-title {
      font-family: "Comic Neue", sans-serif;
      font-size: 1.2em;
      font-weight: bold;
      margin: 0 0 0.25em 0;
    }
    .card-subtitle {
      font-size: 0.9em;
      color: var(--sl-color-neutral-600);
      line-height: 1.4;
      overflow-wrap: anywhere;
    }
    .section {
      margin: 1em 0;
    }
    .section h4 {
      margin: 0 0 0.5em 0;
    }
    .form-row {
      display: grid;
      gap: 0.75em;
    }
    .footer {
      display: flex;
      justify-content: flex-end;
      gap: 0.5em;
      margin-top: 1em;
      padding: 0.25em 0;
    }
    .progress-card {
      background: var(--sl-panel-background-color);
      border: 1px solid var(--sl-panel-border-color);
      border-radius: var(--sl-border-radius-medium);
      padding: 1em;
    }
    .progress-success {
      --indicator-color: var(--sl-color-success-500);
    }
    .status-message {
      margin: 0.5em 0;
      color: var(--sl-color-neutral-700);
    }
    .error-message {
      color: var(--sl-color-danger-600);
      margin: 0.5em 0;
    }
    .note {
      font-size: 0.85em;
      color: var(--sl-color-neutral-600);
    }
    input[type="file"] {
      padding: 0.4em 0;
    }
  `;

  static get properties() {
    return {
      step: { type: String },
      initialStep: { type: String },
      selectedOption: { type: String },
      backupTarget: { type: String },
      removableMounts: { type: Array },
      selectedMount: { type: String },
      restoreSource: { type: String },
      restoreFile: { type: Object },
      restorePath: { type: String },
      job: { type: Object },
      jobId: { type: String },
      isWorking: { type: Boolean },
      errorMessage: { type: String },
    };
  }

  constructor() {
    super();
    this.step = "choose";
    this.initialStep = null;
    this.selectedOption = null;
    this.backupTarget = "download";
    this.removableMounts = [];
    this.selectedMount = "";
    this.restoreSource = "upload";
    this.restoreFile = null;
    this.restorePath = "";
    this.job = null;
    this.jobId = null;
    this.isWorking = false;
    this.errorMessage = "";
    this.pollTimeout = null;
  }

  connectedCallback() {
    super.connectedCallback();
    this.loadRemovableMounts();
    this.applyInitialStep();
  }

  disconnectedCallback() {
    if (this.pollTimeout) {
      clearTimeout(this.pollTimeout);
      this.pollTimeout = null;
    }
    super.disconnectedCallback();
  }

  updated(changedProperties) {
    if (changedProperties.has("initialStep")) {
      this.applyInitialStep();
    }
  }

  applyInitialStep() {
    if (this.initialStep === "restore" && this.step === "choose") {
      this.selectedOption = "restore";
      this.step = "restore";
    }
  }

  async loadRemovableMounts() {
    try {
      const res = await getRemovableMounts();
      this.removableMounts = res.mounts || [];
    } catch (err) {
      console.warn("Failed to load removable mounts", err);
    }
  }

  handleOptionSelect(option) {
    this.selectedOption = option;
  }

  handleNext() {
    if (!this.selectedOption) return;
    this.step = this.selectedOption;
    this.errorMessage = "";
  }

  handleBack() {
    this.step = "choose";
    this.selectedOption = null;
    this.errorMessage = "";
  }

  handleDialogClose() {
    this.dispatchEvent(new CustomEvent("sl-request-close", {
      bubbles: true,
      composed: true,
    }));
  }

  handleFileChange(event) {
    const file = event.target.files?.[0];
    this.restoreFile = file || null;
  }

  async handleStartBackup() {
    this.isWorking = true;
    this.errorMessage = "";
    try {
      const res = await startBackup({
        target: this.backupTarget,
        destinationPath: this.backupTarget === "removable" ? this.selectedMount : "",
      });
      this.jobId = res.id;
      this.step = "progress";
      this.pollJob();
    } catch (err) {
      this.errorMessage = "Failed to start backup.";
      console.warn(err);
    } finally {
      this.isWorking = false;
    }
  }

  async handleStartRestore() {
    this.isWorking = true;
    this.errorMessage = "";
    try {
      let res;
      if (this.restoreSource === "upload") {
        if (!this.restoreFile) {
          this.errorMessage = "Select a backup file to restore.";
          return;
        }
        res = await uploadRestore(this.restoreFile);
      } else {
        if (!this.selectedMount || !this.restorePath) {
          this.errorMessage = "Select a mount and file path.";
          return;
        }
        const sourcePath = `${this.selectedMount.replace(/\/$/, "")}/${this.restorePath.replace(/^\//, "")}`;
        res = await startRestoreFromPath(sourcePath);
      }
      this.jobId = res.id;
      this.step = "progress";
      this.pollJob();
    } catch (err) {
      this.errorMessage = "Failed to start restore.";
      console.warn(err);
    } finally {
      this.isWorking = false;
    }
  }

  async pollJob() {
    if (!this.jobId) return;
    try {
      const res = await getJob(this.jobId);
      this.job = res.job;
      if (this.job?.status === "completed" || this.job?.status === "failed") {
        if (this.pollTimeout) {
          clearTimeout(this.pollTimeout);
          this.pollTimeout = null;
        }
        return;
      }
      if (this.pollTimeout) {
        clearTimeout(this.pollTimeout);
      }
      this.pollTimeout = setTimeout(() => this.pollJob(), 1500);
    } catch (err) {
      console.warn("Failed to fetch job status", err);
    }
  }

  async handleDownload() {
    try {
      const blob = await downloadBackup(this.jobId);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `dogebox-backup-${this.jobId}.tar.gz`;
      link.rel = "noopener";
      link.addEventListener("click", (event) => {
        event.stopPropagation();
      });
      document.body.appendChild(link);
      const clickEvent = new MouseEvent("click", { bubbles: false, cancelable: true });
      link.dispatchEvent(clickEvent);
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      this.errorMessage = "Failed to download backup.";
    }
  }

  renderChoice() {
    const backupClass = classMap({
      card: true,
      selected: this.selectedOption === "backup",
    });
    const restoreClass = classMap({
      card: true,
      selected: this.selectedOption === "restore",
    });

    return html`
      <div class="modal-title">Backup and Restore</div>
      <div class="intro-text">
        Choose whether you want to back up your Dogebox configuration or restore from an existing backup.
      </div>
      <div class="card-grid">
        <div class=${backupClass} @click=${() => this.handleOptionSelect("backup")}>
          <div class="card-icon"><sl-icon name="download"></sl-icon></div>
          <div>
            <div class="card-title">Backup</div>
            <div class="card-subtitle">Save your configuration for safekeeping.</div>
          </div>
        </div>
        <div class=${restoreClass} @click=${() => this.handleOptionSelect("restore")}>
          <div class="card-icon"><sl-icon name="upload"></sl-icon></div>
          <div>
            <div class="card-title">Restore</div>
            <div class="card-subtitle">Rebuild a Dogebox from an existing backup.</div>
          </div>
        </div>
      </div>
      <div class="footer">
        <sl-button variant="primary" @click=${this.handleNext} ?disabled=${!this.selectedOption}>
          Next
        </sl-button>
      </div>
    `;
  }

  renderBackupForm() {
    return html`
      <div class="modal-title">Create a Backup</div>
      <div class="section form-row">
        <sl-radio-group label="Backup destination" value=${this.backupTarget} @sl-change=${(e) => (this.backupTarget = e.target.value)}>
          <sl-radio value="download">Download to this browser</sl-radio>
          <sl-radio value="removable">Save to a removable drive</sl-radio>
        </sl-radio-group>
        ${this.backupTarget === "removable"
          ? html`
              <sl-select
                label="Removable drive"
                placeholder="Select a removable drive"
                value=${this.selectedMount}
                @sl-change=${(e) => (this.selectedMount = e.target.value)}
              >
                ${(this.removableMounts || []).map(
                  (mount) => html`<sl-option value=${mount.path}>${mount.label || mount.path}</sl-option>`,
                )}
              </sl-select>
            `
          : nothing}
      </div>
      ${this.errorMessage ? html`<div class="error-message">${this.errorMessage}</div>` : nothing}
      <div class="footer">
        <sl-button variant="neutral" @click=${this.handleBack}>Back</sl-button>
        <sl-button
          variant="primary"
          @click=${this.handleStartBackup}
          ?loading=${this.isWorking}
          ?disabled=${this.backupTarget === "removable" && !this.selectedMount}
        >
          Start Backup
        </sl-button>
      </div>
    `;
  }

  renderRestoreForm() {
    return html`
      <div class="modal-title">Restore from Backup</div>
      <div class="section form-row">
        <sl-radio-group label="Restore source" value=${this.restoreSource} @sl-change=${(e) => (this.restoreSource = e.target.value)}>
          <sl-radio value="upload">Upload backup file</sl-radio>
          <sl-radio value="removable">Use removable drive</sl-radio>
        </sl-radio-group>
        ${this.restoreSource === "upload"
          ? html`
              <input type="file" @change=${this.handleFileChange} />
            `
          : html`
              <sl-select
                label="Removable drive"
                placeholder="Select a removable drive"
                value=${this.selectedMount}
                @sl-change=${(e) => (this.selectedMount = e.target.value)}
              >
                ${(this.removableMounts || []).map(
                  (mount) => html`<sl-option value=${mount.path}>${mount.label || mount.path}</sl-option>`,
                )}
              </sl-select>
              <sl-input
                label="Backup file name"
                placeholder="dogebox-backup-xxxx.tar.gz"
                value=${this.restorePath}
                @sl-input=${(e) => (this.restorePath = e.target.value)}
              ></sl-input>
            `}
        <div class="note">Restoring replaces current configuration.</div>
      </div>
      ${this.errorMessage ? html`<div class="error-message">${this.errorMessage}</div>` : nothing}
      <div class="footer">
        <sl-button variant="neutral" @click=${this.handleBack}>Back</sl-button>
        <sl-button variant="primary" @click=${this.handleStartRestore} ?loading=${this.isWorking}>
          Start Restore
        </sl-button>
      </div>
    `;
  }

  renderProgress() {
    const progress = this.job?.progress ?? 0;
    const isComplete = this.job?.status === "completed";
    const isFailed = this.job?.status === "failed";
    const showSimpleStatus = this.selectedOption === "restore" && !isComplete && !isFailed;
    const statusMessage = showSimpleStatus
      ? "Restoring backup. This may take a few minutes."
      : (this.job?.summaryMessage || "Working...");

    return html`
      <div class="modal-title">In Progress</div>
      <div class="progress-card">
        <sl-progress-bar class=${isComplete ? "progress-success" : ""} value=${progress}></sl-progress-bar>
        <div class="status-message">${statusMessage}</div>
        ${isFailed ? html`<div class="error-message">${this.job?.errorMessage || "Operation failed."}</div>` : nothing}
        ${isComplete && this.selectedOption === "backup" && this.backupTarget === "download"
          ? html`
              <sl-button variant="primary" @click=${this.handleDownload}>Download Backup</sl-button>
            `
          : nothing}
        ${isComplete && this.selectedOption === "backup" && this.backupTarget === "removable"
          ? html`<div class="note">Backup saved to the selected removable drive.</div>`
          : nothing}
        ${isComplete && this.selectedOption === "restore"
          ? html`<div class="note">Restore complete. A rebuild has been triggered.</div>`
          : nothing}
      </div>
      <div class="footer">
        <sl-button variant="primary" @click=${this.handleDialogClose} ?disabled=${!isComplete && !isFailed}>
          Done
        </sl-button>
      </div>
    `;
  }

  render() {
    switch (this.step) {
      case "choose":
        return this.renderChoice();
      case "backup":
        return this.renderBackupForm();
      case "restore":
        return this.renderRestoreForm();
      case "progress":
        return this.renderProgress();
      default:
        return this.renderChoice();
    }
  }
}

customElements.define("x-action-backup-restore", BackupRestoreAction);
