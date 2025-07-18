import {
  LitElement,
  html,
  css,
  nothing,
  choose,
} from "/vendor/@lit/all@3.1.2/lit-all.min.js";
import { createAlert } from "/components/common/alert.js";
import { asyncTimeout } from "/utils/timeout.js";
import "/components/common/action-row/action-row.js";
import "/components/views/x-activity-log.js";
import "/components/common/text-loader/text-loader.js";
import { getDisks, postInstallToDisk } from "/api/disks/disks.js";
import { promptPowerOff } from "/pages/page-settings/power-helpers.js";
import { mainChannel } from "/controllers/sockets/main-channel.js";

const PAGE_ONE = "intro";
const PAGE_TWO = "disk_selection";
const PAGE_THREE = "confirmation";
const PAGE_FOUR = "installation";

export class LocationPickerView extends LitElement {
  static get properties() {
    return {
      installationBootMedia: { type: String },
      installationState: { type: String },
      renderReady: { type: Boolean },
      mainDialogOpen: { type: Boolean },
      _ready: { type: Boolean },
      _inflight_disks: { type: Boolean },
      _page: { type: String },
      _disks: { type: Array },
      _selected_disk_index: { type: Number },
      _confirmation_checked: { type: Boolean },
      _inflight_install: { type: Boolean },
      _install_outcome: { type: String },
      _logs: { type: Array, state: true },
      _fetchDisks: { type: Boolean },
    };
  }

  constructor() {
    super();
    this.renderReady = false;
    this.existingInstallationDialogOpen = false;
    this.mainDialogOpen = false;
    this._ready = false;
    this._page = PAGE_ONE;
    this._allDisks = [];
    this._installDisks = [];
    this._bootMediaDisk = null;
    this._selected_disk_index = null;
    this._confirmation_checked = false;
    this._inflight_install = false;
    this._install_outcome = "";
    this._header = "Such Install";
    this._logs = [];
    this._unsubscribe = null;
    this._fetchDisks = false;
  }

  willUpdate() {
    this._fetchDisks =
      this.installationBootMedia === "ro" ||
      this.installationState === "notInstalled";
    this.mainDialogOpen = this.renderReady && this._fetchDisks;

    if (this._fetchDisks) {
      this._inflight_disks = true;
      this.fetchDisks();
    }
  }

  firstUpdated() {
    // Set initial logs
    const initialLogs = mainChannel.getRecoveryLogs();
    if (initialLogs && initialLogs.length > 0) {
      this._logs = initialLogs.map((msg) => ({ msg }));
    }
  }

  async fetchDisks() {
    this._allDisks = await getDisks();
    this._installDisks = this._allDisks.filter(
      (d) => d?.suitability?.install?.usable,
    );
    this._bootMediaDisk = this._allDisks.find((d) => d.bootMedia);
    this._inflight_disks = false;
  }

  connectedCallback() {
    super.connectedCallback();
    this.addEventListener("sl-request-close", this.denyClose);

    // Subscribe to message updates
    this._unsubscribe = mainChannel.subscribeToRecoveryLogs((messages) => {
      if (messages && messages.length > 0) {
        this._logs = messages.map((msg) => ({ msg }));
      }
    });
  }

  disconnectedCallback() {
    this.removeEventListener("sl-request-close", this.denyClose);
    if (this._unsubscribe) {
      this._unsubscribe(); // Cleanup subscription
    }
    super.disconnectedCallback();
  }

  denyClose(e) {
    // If we're installing, prevent close.
    if (this._inflight_install) {
      e.preventDefault();
    }

    // If we MUST install, prevent close.
    if (this.installationState === "notInstalled") {
      e.preventDefault();
    }

    // Otherwise, do nothing, allow close.
  }

  render() {
    //Show loading spinner while renderReady is false
    if (!this.renderReady) {
      return this.renderLoadingSpinner();
    }

    // Show existing installation dialog if already installed
    if (
      this.installationBootMedia === "ro" &&
      this.installationState !== "notInstalled"
    ) {
      this.existingInstallationDialogOpen = true;
      return this.renderExistingInstall();
    }

    return html`
      <sl-dialog ?open=${this.mainDialogOpen} no-header>
        <div class="wrap">
          ${choose(this._page, [
            [PAGE_ONE, this.renderIntro],
            [PAGE_TWO, this.renderList],
            [PAGE_THREE, this.renderConfirm],
            [PAGE_FOUR, this.renderInstallation],
          ])}
        </div>
      </sl-dialog>
    `;
  }

  renderHeader = () => {
    return html`
      <div class="header-container">
        <img
          class="logo"
          src="/static/img/dogebox-logo-small.png"
          alt="Dogebox Logo"
        />
        <h1>${this._header}</h1>
      </div>
    `;
  };

  renderExistingInstall = () => {
    return html`
      <sl-dialog ?open=${this.existingInstallationDialogOpen} no-header>
        <div class="dialog-content">
          ${this.renderHeader()}
          <div class="wrap">
            <h2 style="margin-bottom: 24px;">
              Dogebox OS is already installed on this device
            </h2>
            <p>
              If you just installed, you might have forgotten to
              <u>remove the installation media</u>. Please power off and try
              again.
            </p>
            <sl-button
              variant="warning"
              @click=${promptPowerOff}
              style="margin-block-start: 1em;"
            >
              <sl-icon name="power"></sl-icon>
              Shutdown
            </sl-button>
            <div>
              <sl-button
                style="margin-block-start: 2em;"
                @click=${() => {
                  this.installationState = "notInstalled";
                  this.existingInstallationDialogOpen = false;
                  this.mainDialogOpen = true;
                }}
                >I know what I'm doing - I want to reinstall</sl-button
              >
            </div>
          </div>
        </div>
      </sl-dialog>
    `;
  };

  renderLoadingSpinner = () => {
    return html`
      <sl-dialog ?open=${true} no-header>
        <div class="loader-overlay">
          <sl-spinner class="spinner"></sl-spinner>
          <text-loader
            loop
            .texts=${["HOdL tight"]}
            ?loopEnd=${this.renderReady}
          >
          </text-loader>
        </div>
      </sl-dialog>
    `;
  };

  renderIntro = () => {
    return html`
      <div class="page">
        ${this.renderHeader()}
        <p>Where you install Dogebox OS is up to you</p>

        <div class="choice-wrap">
          <sl-button
            class="big-choice-button"
            ?disabled=${this.installationBootMedia === "ro" ||
            this.installationState === "notInstalled"}
            @click=${this.handleStay}
          >
            <div class="button a"></div>
            <div class="button-label a">I stay</div>
          </sl-button>

          <sl-button
            class="big-choice-button"
            ?disabled=${false}
            @click=${() => (this._page = PAGE_TWO)}
          >
            <div class="button b"></div>
            <div class="button-label a">I choose</div>
          </sl-button>
        </div>

        <div class="alert-wrap">
          ${this.installationBootMedia === "rw" &&
          this.installationState !== "configured"
            ? html`
                <sl-alert open>
                  Dogebox OS is currently running from a suitable disk
                  (${this._bootMediaDisk
                    ? `${this._bootMediaDisk.name} - ${this._bootMediaDisk.sizePretty}`
                    : `read/write, over 100gb`}).
                  You can continue running from this disk OR select another.
                </sl-alert>
              `
            : nothing}
          ${this.installationBootMedia === "ro"
            ? html`
                <sl-alert variant="warning" open>
                  Dogebox OS is currently running from an unsuitable disk
                  (read-only). You must choose an alternate disk to install
                  Dogebox OS on to continue.
                </sl-alert>
              `
            : nothing}
          <div>
            <p style="line-height: 1.1; color: #777">
              <small
                >You can select your
                <u>mass storage location</u> later<br />(for blockchain, app
                data, etc..)</small
              >
            </p>
          </div>
        </div>
      </div>
    `;
  };

  renderList = () => {
    return html`
      <div class="page">
        <sl-button
          variant="text"
          @click=${() => (this._page = PAGE_ONE)}
          class="back-button"
        >
          Back
        </sl-button>

        ${this.renderHeader()}
        <p>Select from the following disks:</p>

        <div class="disk-wrap">
          ${this._inflight_disks
            ? html`
                <div class="disk-spinner">
                  <sl-spinner></sl-spinner>
                </div>
              `
            : nothing}
          ${!this._inflight_disks && !this._installDisks.length
            ? html`
                <div class="disk-empty">
                  <h3>Such empty.</h3>
                  <p>No suitable installation disks found.</p>
                </div>
              `
            : nothing}
          ${this._installDisks.length
            ? this._installDisks.map(
                (disk) => html`
                  <action-row
                    prefix="hdd-fill"
                    data-name=${disk.name}
                    label=${disk.name}
                    .trigger=${this.handleDiskSelection}
                  >
                    ${disk.sizePretty}
                  </action-row>
                `,
              )
            : nothing}
        </div>

        <p>
          <small
            >Installation disks must be unmounted and have >10Gb
            capacity.</small
          >
        </p>
      </div>
    `;
  };

  renderConfirm = () => {
    const selectedDisk = this._installDisks[this._selected_disk_index];
    return html`
      <div class="page">
        <sl-button
          variant="text"
          @click=${() => {
            this._page = PAGE_TWO;
            this._confirmation_checked = false;
          }}
          class="back-button"
        >
          Back
        </sl-button>

        ${this.renderHeader()}
        <p>
          Selected disk:
          <strong>${selectedDisk.name} (${selectedDisk.sizePretty})</strong>
        </p>

        <sl-alert open variant="warning" style="text-align: left">
          <sl-icon slot="icon" name="exclamation-triangle"></sl-icon>
          Take care.
          ${selectedDisk?.suitability?.isAlreadyUsed
            ? html`The selected disk <strong>${selectedDisk.name}</strong>
                <u>has existing data</u>. This action will wipe all data and is
                not reversable.`
            : html`This will wipe all data on
                <strong>${selectedDisk.name}</strong> and is not reversable.`}
        </sl-alert>

        <sl-divider></sl-divider>

        <div class="action-wrap">
          <sl-checkbox
            @sl-change=${this.handleCheckboxChange}
            ?disabled=${this._inflight_install}
            >I understand</sl-checkbox
          >
          <sl-button
            variant="warning"
            ?disabled=${!this._confirmation_checked || this._inflight_install}
            @click=${this.handleSubmit}
          >
            Install now
          </sl-button>
        </div>
      </div>
    `;
  };

  renderInstallation = () => {
    const selectedDisk = this._installDisks[this._selected_disk_index];
    return html`
      <div class="page">
        ${this.renderHeader()}
        <p>
          Installing on disk:
          <strong>${selectedDisk.name} (${selectedDisk.sizePretty})</strong>
        </p>

        ${!this._inflight_install && this._install_outcome === "success"
          ? html`
              <sl-alert open variant="success" style="text-align: left">
                <small style="display:inline-block; margin-bottom: 4px;"
                  >Installation complete</small
                >
                <sl-progress-bar
                  value="100"
                  style="--indicator-color: var(--sl-color-success-600)"
                ></sl-progress-bar>
              </sl-alert>
            `
          : nothing}
        ${!this._inflight_install && this._install_outcome === "error"
          ? html`
              <sl-alert open variant="danger" style="text-align: left">
                <small style="display:inline-block; margin-bottom: 4px;"
                  >Installation failed</small
                >
                <sl-progress-bar
                  value="23"
                  style="--indicator-color: var(--sl-color-danger-600)"
                ></sl-progress-bar>
              </sl-alert>
            `
          : nothing}
        ${this._inflight_install
          ? html`
              <sl-alert open variant="primary" style="text-align: left">
                <small style="display:inline-block; margin-bottom: 4px;"
                  >Installation in progress</small
                >
                <sl-progress-bar indeterminate></sl-progress-bar>
              </sl-alert>
            `
          : nothing}

        <div class="activity-log-wrap">
          <x-activity-log .logs=${this._logs}></x-activity-log>
        </div>

        ${this._inflight_install
          ? html` <p>
              <small
                >This may take 10 minutes or more. Do not refresh or power off
                your Dogebox while installation is in progress.</small
              >
            </p>`
          : nothing}
        ${!this._inflight_install && this._install_outcome
          ? html`
              <p class="note-text">Please reboot your Dogebox</p>
              <p class="note-text">
                While powered off, don't forget to remove the installation media
              </p>
              <sl-button
                variant="warning"
                @click=${promptPowerOff}
                style="margin-block-start: 1em;"
              >
                <sl-icon name="power"></sl-icon>
                Shutdown
              </sl-button>
            `
          : nothing}
      </div>
    `;
  };

  handleCheckboxChange(e) {
    this._confirmation_checked = e.target.checked;
  }

  handleStay() {
    this.mainDialogOpen = false;
    return;
  }

  handleDiskSelection = (e, row) => {
    const diskName = row.getAttribute("data-name");
    const found = this._installDisks.findIndex((d) => d.name === diskName);
    if (found !== -1) {
      this._selected_disk_index = found;
      this._page = PAGE_THREE;
    }

    if (found === -1) {
      createAlert(
        "warning",
        "Hmm, there was a problem selecting this disk. Please refresh and try again",
      );
    }
  };

  async handleSubmit() {
    this._page = PAGE_FOUR;
    this._inflight_install = true;

    this.requestUpdate();

    let didErr = false;

    try {
      await asyncTimeout(3000);
      const diskName = this._installDisks[this._selected_disk_index].name;
      const res = await postInstallToDisk({
        disk: diskName,
        secret: "yes-i-will-destroy-everything-on-this-disk",
      });

      createAlert("success", [
        "Installation complete",
        "Please reboot your Dogebox",
      ]);
    } catch (err) {
      didErr = true;
      console.log("Installation error:", err);
      createAlert("danger", "Failed to install on selected disk");
    } finally {
      this._inflight_install = false;
      this._install_outcome = didErr ? "error" : "success";
    }
  }

  static styles = css`
    sl-dialog::part(overlay) {
      background-color: rgba(0,0,0,0.85);
    }

    sl-dialog::part(body) {
      display: flex;
      justify-content: center;
      align-items: center;
    }

    .dialog-content {
      text-align: center;
    }

    .wrap {
      text-align: center;
      position: relative;
    }

    .loader-overlay {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
    }

    .spinner {
      font-size: 4rem;
      --indicator-color: #bbb;
    }

    h1 {
      display: block;
      margin-top: 0px;
      margin-bottom: 0px;
      font-family: 'Comic Neue';
      font-weight: bold;
    }

    h2 {
      display: block;
      font-family: 'Comic Neue';
      font-weight: bold;
      margin-top: 0px;
    }

    .header-container {
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .logo {
      width: 100px;
      height: auto;
    }

    .button {
      height: 275px;
      width: 175px;
      display: flex;
      align-items: center;
      justify-content: center;
      background-size: contain;
    }

    sl-button.big-choice-button::part(label) { padding: 1px; !important }

    .button.a {
      background-image: url('/static/img/install-stay.png');
    }

    .button.b {
      background-image: url('/static/img/install-choose.png');
    }

    .back-button {
      position: absolute;
      left: -12px;
      top: -12px;
    }

    .choice-wrap {
      display: flex;
      flex-direction: row;
      justify-content: center;
      gap: 1em;
    }

    .alert-wrap {
      width: calc(360px + 1em);
      margin: 1em auto;
    }

    .disk-wrap {
      background: rgba(0, 0, 0, 0.25);
      border-radius: 4px;
      border-color: #333;
      padding: 1em;
      text-align: left;
    }

    .disk-spinner {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 200px;
      text-align: center;
      font-size: 2em;
    }

    .disk-empty {
      color: #666;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      h3 { font-family: 'Comic Neue'; margin-bottom: -1em; }
      p { font-size: 0.9rem; }
    }

    .action-wrap {
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: center;
      gap: 1.5em;
      width: 100%;
    }

    .note-text {
      margin-block-start: 0em;
      margin-block-end: 0em;

    .activity-log-wrap {
      text-align: left;
      margin-top: 12px;
    }
  `;
}

customElements.define("action-select-install-location", LocationPickerView);
