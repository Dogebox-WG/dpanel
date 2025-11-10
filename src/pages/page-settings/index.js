import {
  LitElement,
  html,
  css,
  choose,
  nothing,
} from "/vendor/@lit/all@3.1.2/lit-all.min.js";
import "/components/common/action-row/action-row.js";
import "/components/views/action-check-updates/index.js";
import "/components/views/action-remote-access/index.js";
import "/components/views/x-log-viewer/index.js";
import "/components/views/x-activity-log.js";
import { notYet } from "/components/common/not-yet-implemented.js";
import { store } from "/state/store.js";
import { StoreSubscriber } from "/state/subscribe.js";
import { getRouter } from "/router/index.js";
import { pkgController } from "/controllers/package/index.js";
import { jobsController } from "/controllers/jobs/index.js";
import { promptPowerOff, promptReboot } from "./power-helpers.js";
import { doBootstrap } from '/api/bootstrap/bootstrap.js';
import { importBlockchain } from '/api/system/import-blockchain-data.js';

class SettingsPage extends LitElement {
  static styles = css`
    .padded {
      padding: 20px;
    }
    h1 {
      font-family: "Comic Neue", sans-serif;
    }

    section {
      margin-bottom: 2em;
    }

    section div {
      margin-bottom: 1em;
    }

    section .section-title {
      margin-bottom: 0em;
    }

    section .section-title h3 {
      text-transform: uppercase;
      font-family: "Comic Neue";
    }

    .log-viewer-container {
      margin-top: 1em;
      border: 1px solid var(--sl-color-neutral-300);
      border-radius: var(--sl-border-radius-medium);
      overflow: hidden;
    }
  `;

  static get properties() {
    return {
      inflight_import_blockchain: { type: Boolean },
      showImportLogs: { type: Boolean },
      systemLogs: { type: Array },
      showImportLogsModal: { type: Boolean },
      isSystemUpdateLocked: { type: Boolean },
      systemUpdateStatus: { type: String },
    };
  }

  constructor() {
    super();
    this.context = new StoreSubscriber(this, store);
    this.pkgController = pkgController;
    this.isSystemUpdateLocked = jobsController.isSystemUpdateLocked();
    this.systemUpdateStatus = jobsController.getActiveSystemUpdateStatus();
    this.updatesRowDescription = this.buildUpdatesRowDescription();
    this.inflight_import_blockchain = false;
    this.showImportLogs = false;
    this.systemLogs = [];
    this.showImportLogsModal = false;
  }

  connectedCallback() {
    super.connectedCallback();
    // Subscribe to pkgController for system activity updates
    this.pkgController.addObserver(this);
    jobsController.addObserver(this);
    console.log('Settings page subscribed to pkgController for system activity updates');
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    // Unsubscribe from pkgController
    this.pkgController.removeObserver(this);
    jobsController.removeObserver(this);
    
    // Reset import state when leaving the page
    this.inflight_import_blockchain = false;
    this.showImportLogs = false;
    this.systemLogs = [];
    this.showImportLogsModal = false;
  }x

  onJobsUpdate(state) {
    if (
      state?.isSystemUpdateLocked === this.isSystemUpdateLocked &&
      state?.systemUpdateStatus === this.systemUpdateStatus
    ) {
      return;
    }

    this.isSystemUpdateLocked = state?.isSystemUpdateLocked;
    this.systemUpdateStatus = state?.systemUpdateStatus;
    this.updatesRowDescription = this.buildUpdatesRowDescription();
    this.requestUpdate();
  }

  handleDialogClose() {
    store.updateState({ dialogContext: { name: null }});
    const router = getRouter();
    router.go('/settings', { replace: true });
  }

  handleImportLogsModalClose() {
    this.showImportLogsModal = false;
    // Clear the logs when closing the modal
    this.systemLogs = [];
    this.requestUpdate();
  }

  handleMenuClick = (event, el) => {
    const dialogName = el.getAttribute("name");
    store.updateState({ dialogContext: { name: dialogName }});
    const router = getRouter();
    router.go(`/settings/${dialogName}`, { replace: true });
  };

  async handleImportBlockchain() {
    this.inflight_import_blockchain = true;
    this.showImportLogs = true;
    this.showImportLogsModal = true;
    console.log('Starting import blockchain process...');
    console.log('Modal state set to:', this.showImportLogsModal);
    
    // Enable progress logging for debugging
    store.updateState({ networkContext: { logProgressUpdates: true } });
    
    this.requestUpdate();

    try {
      // Call the system-level import blockchain API
      // The backend will handle finding the Dogecoin Core pup, stopping it, importing, and restarting
      const result = await importBlockchain();
      console.log('Import blockchain API call result:', result);
      
      // Close the import dialog by clearing the dialog context
      store.updateState({ dialogContext: { name: null }});
      
      // The system activity logs will show the progress via WebSocket
      // We don't need to handle success/error callbacks here since it's a system action
    } catch (error) {
      console.error('Failed to initiate import blockchain:', error);
      this.inflight_import_blockchain = false;
      this.requestUpdate();
    }
  }

  requestUpdate(options = {}) {
    // This component is an observer of pkgController changes
    // In response to pkgControllers notification of a 'system-activity'
    // this function can determine whether there are new system logs
    // to display to the user.
    if (this.pkgController && options.type === 'system-activity') {
      // Filter for blockchain import logs and update the system logs
      const allSystemLogs = this.pkgController.activityIndex['system'] || [];
      console.log('System activity received:', allSystemLogs);
      
      this.systemLogs = allSystemLogs.filter(log => 
        log.step === "import-blockchain-data"
      );

      console.log('Filtered blockchain logs:', this.systemLogs);
    }
    super.requestUpdate();
  }

  buildUpdatesRowDescription() {
    if (this.isSystemUpdateLocked) {
      const status = this.systemUpdateStatus || "active";
      return `Disabled while a system update is ${status}.`;
    }
    return "Check for updates";
  }

  render() {
    const { updateAvailable } = store.getContext('sys')
    const dialog = store.getContext('dialog')
    const hasSettingsDialog = ["updates", "versions", "remote-access", "import-blockchain"].includes(dialog.name);
    
    // Debug logging
    console.log('Settings page render:', {
      showImportLogs: this.showImportLogs,
      showImportLogsModal: this.showImportLogsModal,
      systemLogsLength: this.systemLogs.length,
      systemLogs: this.systemLogs,
      shouldShowLogs: this.showImportLogs || this.systemLogs.length > 0
    });
    return html`
      <div class="padded">
        <section>
          <div class="section-title">
            <h3>Menu</h3>
          </div>
          <div class="list-wrap">
            <action-row prefix="info-circle" label="Version" href="/settings/versions" @click=${notYet}>
              View version details
            </action-row>
            <action-row prefix="arrow-repeat" ?dot=${updateAvailable} label="Updates" href="/settings/updates" ?disabled=${this.isSystemUpdateLocked}>
              ${this.updatesRowDescription}
            </action-row>
            <action-row prefix="wifi" label="Wifi" @click=${notYet}>
              Add or remove Wifi networks
            </action-row>
            <action-row prefix="key" label="Remote Access" href="/settings/remote-access">
              Manage SSH settings and keys
            </action-row>
            <action-row prefix="usb-drive-fill" name="import-blockchain" label="Import Blockchain" .trigger=${this.handleMenuClick}>
              Import existing Dogecoin Core blockchain data from external drive
            </action-row>
          <div class="list-wrap">
        </section>



        <section>
          <div class="section-title">
            <h3>Power</h3>
          </div>
          <action-row prefix="power" label="Shutdown" @click=${promptPowerOff}>
            Gracefully shutdown your Dogebox
          </action-row>

          <action-row prefix="arrow-counterclockwise" label="Restart" @click=${promptReboot}>
            Gracefully restart your Dogebox
          </action-row>
        </section>

        <section>
          <div class="section-title">
            <h3>Help</h3>
          </div>
            <action-row prefix="book" label="Documentation" href="https://dogebox-docs.dogecoin.org/" target="_blank">
              View the Dogebox documentation
            </action-row>
      </div>

      <sl-dialog no-header
        ?open=${hasSettingsDialog} @sl-request-close=${this.handleDialogClose}>
        ${choose(dialog.name, [
          ["updates", () => html`<x-action-check-updates></x-action-check-updates>`],
          ["remote-access", () => html`<x-action-remote-access></x-action-remote-access>`],
          ["versions", () => renderVersionsDialog(store, this.handleDialogClose)],
          ["import-blockchain", () => this.renderImportBlockchainDialog()],
        ])}
      </sl-dialog>

      <sl-dialog label="Import Blockchain Progress" 
        ?open=${this.showImportLogsModal} 
        @sl-request-close=${this.handleImportLogsModalClose}
        @sl-hide=${this.handleImportLogsModalClose}
        style="--width: 80vw; --height: 80vh;">
        <div style="padding: 0.5em;">
          <p style="margin: 0 0 0.25em 0;">Importing Dogecoin Core blockchain data. This process may take a long time depending on the blockchain size.</p>
          <div class="log-viewer-container">
            <x-activity-log .logs=${this.systemLogs} name="import-blockchain"></x-activity-log>
          </div>
        </div>
      </sl-dialog>
    `;
  }

  renderImportBlockchainDialog() {
    return html`
      <div style="padding: 1em;">
        <h3>Import Dogecoin Core Blockchain Data</h3>
        <p>This feature allows you to import existing Dogecoin Core blockchain data from an external drive, which can significantly speed up the initial synchronization process.</p>
        
        <div style="margin: 1em 0;">
          <h4>Prerequisites:</h4>
          <ul>
            <li>An external drive containing Dogecoin Core blockchain data ('blocks' and 'chainstate' directories at the root level of the drive)</li>
            <li>The drive should be connected and accessible</li>
          </ul>
        </div>

        <div style="margin: 1em 0;">
          <h4>What happens:</h4>
          <ol>
            <li>The system automatically finds and stops the Dogecoin Core pup if it's running</li>
            <li>Copies the blockchain data to the pup's storage</li>
            <li>Restarts the pup if it was previously running</li>
            <li>You can monitor the progress in real-time</li>
          </ol>
        </div>

        <div style="margin: 1em 0;">
          <h4>Important Notes:</h4>
          <ul>
            <li>The copy process can take a very long time depending on the blockchain size</li>
            <li>Dogecoin Core blockchain is approximately 200GB+ (as of 2025)</li>
            <li>Ensure your device has enough storage space for the blockchain data</li>
          </ul>
        </div>
      </div>
      <sl-button slot="footer" variant="primary" @click=${this.handleImportBlockchain} ?loading=${this.inflight_import_blockchain} ?disabled=${this.inflight_import_blockchain}>Start Import Process</sl-button>
      <sl-button slot="footer" variant="neutral" @click=${this.handleDialogClose}>Cancel</sl-button>
    `;
  }
}

customElements.define("x-page-settings", SettingsPage);

function renderVersionsDialog(store, closeFn) {
  const { dbxVersion } = store.getContext('app')
  return html`
    <div style="text-align: center;">
      <h1>Versions</h1>

      <div style="text-align: left; margin-bottom: 1em;">
        <action-row prefix="box" expandable label="Dogebox ${dbxVersion}">
          Bundles Dogeboxd, DKM & dPanel
          <div slot="hidden"><small style="line-height: 1.1; display: block;">Lorem ad ex nostrud magna nisi ea enim magna exercitation aliquip enim amet ad deserunt sit irure aute proident.</div>
        </action-row>
      </div>

      <sl-button variant="text" @click=${closeFn}>Dismiss</sl-button>
    </div>
  `
}