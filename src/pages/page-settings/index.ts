import {
  LitElement,
  html,
  css,
  choose,
  nothing,
} from "/lib/lit-all.js";
import "/components/common/action-row/action-row.js";
import "/components/common/dbx-modal/index.js";
import "/components/views/action-check-updates/index.js";
import "/components/views/action-date-time/index.js";
import "/components/views/action-language/index.js";
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

import type { JobsControllerState } from "/controllers/jobs/index.js";
import type { ActionProgress } from "/types/jobs";
import type { Store } from "/state/store.js";

class SettingsPage extends LitElement {
  declare inflight_import_blockchain: boolean;
  declare showImportLogs: boolean;
  declare systemLogs: ActionProgress[];
  declare showImportLogsModal: boolean;
  declare isSystemUpdateLocked: boolean;
  declare systemUpdateStatus: string;

  context: StoreSubscriber;
  pkgController: typeof pkgController;
  updatesRowDescription: string;

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
  }

  onJobsUpdate(state: JobsControllerState) {
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
    router?.go('/settings', { replace: true });
  }

  handleImportLogsModalClose() {
    this.showImportLogsModal = false;
    // Clear the logs when closing the modal
    this.systemLogs = [];
    this.requestUpdate();
  }

  handleMenuClick = (event: Event, el: HTMLElement) => {
    event?.preventDefault?.();
    event?.stopPropagation?.();
    const dialogName = el.getAttribute("name");
    store.updateState({ dialogContext: { name: dialogName }});
    const router = getRouter();
    router?.go(`/settings/${dialogName}`, { replace: true });
  };

  handleSettingsPageClick = (event: Event, el: HTMLElement) => {
    event?.preventDefault?.();
    event?.stopPropagation?.();
    store.updateState({ dialogContext: { name: null }});
    const router = getRouter();
    router?.go(el.getAttribute("href") || el.getAttribute("data-route") || "/settings");
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

  requestUpdate(options?: unknown) {
    // This component is an observer of pkgController changes
    // In response to pkgControllers notification of a 'system-activity'
    // this function can determine whether there are new system logs
    // to display to the user.
    if (this.pkgController && (options as { type?: string } | undefined)?.type === 'system-activity') {
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
    const updateAvailable = store.getContext('sys')?.updateAvailable
    const dialog = store.getContext('dialog')
    const hasSettingsDialog = ["updates", "versions", "remote-access", "import-blockchain", "language", "keyboard-layout", "date-time"].includes(dialog?.name ?? "");
    
    return html`
      <div class="padded">
        <section>
          <div class="section-title">
            <h3>General</h3>
          </div>
          <div class="list-wrap">
            <action-row prefix="info-circle" name="versions" label="Version" href="/settings/versions" .trigger=${this.handleMenuClick}>
              View version details
            </action-row>
            <action-row prefix="arrow-repeat" name="updates" ?dot=${updateAvailable} label="Updates" href="/settings/updates" ?disabled=${this.isSystemUpdateLocked} .trigger=${this.handleMenuClick}>
              ${this.updatesRowDescription}
            </action-row>
          </div>
        </section>

        <section>
          <div class="section-title">
            <h3>Configure</h3>
          </div>
          <div class="list-wrap">
            <action-row prefix="wifi" label="Wifi" @click=${notYet}>
              Add or remove Wifi networks
            </action-row>
            <action-row prefix="key" name="remote-access" label="Remote Access" href="/settings/remote-access" .trigger=${this.handleMenuClick}>
              Manage SSH settings and keys
            </action-row>
            <action-row prefix="usb-drive-fill" name="import-blockchain" label="Import Blockchain" .trigger=${this.handleMenuClick}>
              Import existing Dogecoin Core blockchain data from external drive
            </action-row>
            <action-row prefix="keyboard" name="keyboard-layout" label="Keyboard Layout" href="/settings/keyboard-layout" .trigger=${this.handleMenuClick}>
              Choose the right layout for your keyboard
            </action-row>
            <action-row prefix="clock" name="date-time" label="Date and Time" href="/settings/date-time" .trigger=${this.handleMenuClick}>
              Where are we?  What time is it?
            </action-row>
            <action-row
              prefix="code-slash"
              label="Customise OS"
              href="/settings/customise-os"
              .trigger=${this.handleSettingsPageClick}
            >
              Add custom NixOS configuration (Tailscale, VPN, etc)
            </action-row>
          </div>
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
            <h3>Security</h3>
          </div>
          <action-row prefix="box-arrow-right" label="Logout" href="/logout">
            Sign out and return to login
          </action-row>
        </section>

        <section>
          <div class="section-title">
            <h3>Help</h3>
          </div>
            <action-row prefix="book" label="Documentation" href="https://dogebox.org/docs/usage" target="_blank">
              View the Dogebox documentation
            </action-row>
      </div>

      ${this.renderSettingsDialog(dialog?.name ?? "", hasSettingsDialog)}

      <x-dbx-modal
        ?open=${this.showImportLogsModal}
        title="Import Blockchain Progress"
        panel-width="80vw"
        @dbx-close=${() => this.handleImportLogsModalClose()}
      >
        <div slot="custom" style="padding: 0.5em;">
          <p style="margin: 0 0 0.25em 0;">Importing Dogecoin Core blockchain data. This process may take a long time depending on the blockchain size.</p>
          <div class="log-viewer-container">
            <x-activity-log .logs=${this.systemLogs} name="import-blockchain"></x-activity-log>
          </div>
        </div>
      </x-dbx-modal>
    `;
  }

  renderSettingsDialog(dialogName: string, open: boolean) {
    const dialogTitle: string = ({
      updates: "System Updates",
      "remote-access": "Remote Access",
      versions: "Versions",
      "import-blockchain": "Import Dogecoin Core Blockchain Data",
      language: "Keyboard Layout",
      "keyboard-layout": "Keyboard Layout",
      "date-time": "Date and Time",
    } as Record<string, string>)[dialogName] ?? "Settings";

    const isImportBlockchain = dialogName === "import-blockchain";

    return html`
      <x-dbx-modal
        ?open=${open}
        title=${dialogTitle}
        footer-text-label=${isImportBlockchain ? "Cancel" : ""}
        footerLabel=${isImportBlockchain ? "Start Import Process" : ""}
        footerVariant="primary"
        ?footerLoading=${this.inflight_import_blockchain}
        ?footerDisabled=${this.inflight_import_blockchain}
        @dbx-close=${() => this.handleDialogClose()}
        @dbx-footer-text-click=${() => this.handleDialogClose()}
        @dbx-footer-click=${() => this.handleImportBlockchain()}
      >
        ${choose(dialogName, [
          ["updates", () => html`<x-action-check-updates slot="custom" hide-title></x-action-check-updates>`],
          ["remote-access", () => html`<x-action-remote-access slot="custom" hide-title></x-action-remote-access>`],
          ["versions", () => html`<div slot="custom">${renderVersionsDialog(store)}</div>`],
          ["import-blockchain", () => html`<div slot="custom">${this.renderImportBlockchainDialog()}</div>`],
          ["language", () => html`<x-action-language slot="custom" hide-title @sl-request-close=${() => this.handleDialogClose()}></x-action-language>`],
          ["keyboard-layout", () => html`<x-action-language slot="custom" hide-title @sl-request-close=${() => this.handleDialogClose()}></x-action-language>`],
          ["date-time", () => html`<x-action-date-time slot="custom" hide-title @sl-request-close=${() => this.handleDialogClose()}></x-action-date-time>`],
        ])}
      </x-dbx-modal>
    `;
  }

  renderImportBlockchainDialog() {
    return html`
      <div style="padding: 1em;">
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
    `;
  }
}

customElements.define("x-page-settings", SettingsPage);

function renderVersionsDialog(store: Store) {
  const { dbxVersion, gitCommit, gitDirty } = store.getContext('app') ?? {}
  const displayVersion = dbxVersion || 'Unknown'
  
  return html`
    <div style="text-align: left; margin: 1em 0;">
      <h2 style="margin: 0 0 0.5em 0;">Dogebox</h2>
      <p style="margin: 0 0 0.5em 0;"><strong>Version:</strong> ${displayVersion}</p>
      ${gitCommit ? html`<p style="margin: 0;"><strong>Git commit:</strong> ${gitCommit}${gitDirty ? ' (dirty)' : ''}</p>` : ''}
    </div>
  `
}
