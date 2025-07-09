import {
  html,
  choose,
  unsafeHTML,
} from "/vendor/@lit/all@3.1.2/lit-all.min.js";

import "/components/views/action-dependency-manage/dependency.js";

export function renderDialog() {
  const pkg = this.getPup();
  const { statusId } = pkg.computed;
  const readmeEl = html`<div style="padding: 1em; text-align: center;"> Such empty. This pup does not provide a README.</div>`;
  const deps = pkg?.state?.manifest?.dependencies || [];
  const ints = pkg?.state?.manifest?.interfaces || [];
  const depsEl = html`<x-action-manage-deps .dependencies=${deps} .providers=${pkg.state.providers} editMode pupId=${pkg.state.id}></x-action-manage-deps>`;
  const intsEl = html`<x-action-interface-list .interfaces=${ints}></x-action-interface-list>`;

  const preventUninstallEl = html`
    <p>Cannot uninstall a running Pup.<br/>Please disable ${pkg.state.manifest.meta.name } and try again.</p>
    <sl-button slot="footer" variant="primary" @click=${this.clearDialog}>Dismiss</sl-button>
    <style>p:first-of-type { margin-top: 0px; }</style>
  `

  const uninstallEl = html`
    <p>Are you sure you want to uninstall ${pkg.state.manifest.meta.name}?</p>
    <sl-input placeholder="Type '${pkg.state.manifest.meta.name}' to confirm" @sl-input=${(e) => this._confirmedName = e.target.value }></sl-input>
    <sl-button slot="footer" variant="danger" @click=${this.handleUninstall} ?loading=${this.inflight_uninstall} ?disabled=${this.inflight_uninstall || this._confirmedName !== pkg.state.manifest.meta.name}>Uninstall</sl-button>
    <style>p:first-of-type { margin-top: 0px; }</style>
  `;

  const configEl = html`
    <dynamic-form
      .values=${pkg?.state.config}
      .fields=${pkg?.state.manifest?.config}
      .onSubmit=${this.submitConfig}
      requireCommit
      markModifiedFields
      allowDiscardChanges
    >
    </dynamic-form>
  `;

  const importBlockchainEl = html`
    <div style="padding: 1em;">
      <h3>Import Dogecoin Core Blockchain Data</h3>
      <p>This feature allows you to import existing Dogecoin Core blockchain data from an external drive, which can significantly speed up the initial synchronization process.</p>
      
      <div style="margin: 1em 0;">
        <h4>Prerequisites:</h4>
        <ul>
          <li>An external drive containing Dogecoin Core blockchain data ('blocks' and 'chainstate' directories at the root level of the drive)</li>
          <li>The Dogecoin Core pup must be installed (but doesn't need to be running)</li>
        </ul>
      </div>

      <div style="margin: 1em 0;">
        <h4>What happens:</h4>
        <ol>
          <li>Stops the Dogecoin Core pup if it's running</li>
          <li>Copies the blockchain data to the pup's storage</li>
          <li>Restarts the pup if it was previously running</li>
        </ol>
      </div>

      <div style="margin: 1em 0;">
        <h4>Important Notes:</h4>
        <ul>
          <li>The copy process can take a very long time depending on the blockchain size</li>
          <li>Dogecoin Core blockchain is approximately 200GB+ (as of 2025)</li>
          <li>Ensure the pup has enough storage space for the blockchain data</li>
          <li>Always backup your blockchain data before importing</li>
        </ul>
      </div>
    </div>
    <sl-button slot="footer" variant="primary" @click=${() => { this.handleImportBlockchain(); this.clearDialog(); }} ?loading=${this.inflight_import_blockchain} ?disabled=${this.inflight_import_blockchain}>Start Import Process</sl-button>
    <sl-button slot="footer" variant="neutral" @click=${this.clearDialog}>Cancel</sl-button>
  `;

  const isStopped = !this.pupEnabled && statusId !== "running";

  return html`
    ${choose(
      this.open_dialog,
      [
        ["readme", () => readmeEl],
        ["deps", () => depsEl],
        ["ints", () => intsEl],
        ["configure", () => configEl],
        ["uninstall", () => isStopped ? uninstallEl : preventUninstallEl],
        ["import-blockchain", () => importBlockchainEl],
      ],
      () => html`<span>View not provided: ${this.open_dialog}</span>`,
    )}
  `;
}

