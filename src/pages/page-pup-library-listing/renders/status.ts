import { html, css, classMap, nothing } from "/lib/lit-all.js";
import { rollbackPup } from "/api/pup-updates/pup-updates.js";
import { createAlert } from "/components/common/alert.js";

import type { EnrichedPup } from "/types/pup-model";
import type { PupLabels, PupPage } from "../index.js";

export function renderStatus(this: PupPage, labels: PupLabels, pkg: EnrichedPup, rollbackAvailable = false) {
  let { statusId, statusLabel, installationId, installationLabel } = labels;
  const isInstallationLoadingStatus = ["uninstalling", "purging", "upgrading"].includes(installationId ?? "")
  const unavailableFromSource = pkg?.computed?.unavailableFromSource;

  const styles = css`
    :host {
      --color-neutral: #8e8e9a;
    }

    .status-label {
      font-size: 2em;
      line-height: 1.5;
      display: block;
      padding-bottom: 0.5rem;
      font-family: 'Comic Neue';
      text-transform: capitalize;
      color: var(--color-neutral);

      &.needs_deps { color: var(--sl-color-amber-600); }
      &.needs_config { color: var(--sl-color-amber-600); }

      &.starting { color: var(--sl-color-primary-600); }
      &.stopping { color: var(--sl-color-danger-600); }
      &.running { color: #07ffae; }
      &.stopped { color: var(--color-neutral); }

      &.broken { color: var(--sl-color-danger-600);}
      &.upgrading { color: var(--sl-color-primary-600); }
      &.uninstalling { color: var(--sl-color-danger-600); }
      &.uninstalled { color: var(--sl-color-danger-600); }
      &.purging { color: var(--sl-color-danger-600); }
    }

    .rollback-section {
      margin-top: 1em;
      padding: 1em;
      background: rgba(0, 0, 0, 0.2);
      border-radius: 8px;
      border: 1px solid var(--sl-color-warning-500);
    }

    .rollback-section h4 {
      margin: 0 0 0.5em 0;
      color: var(--sl-color-warning-500);
      font-family: 'Comic Neue';
    }

    .rollback-section p {
      margin: 0 0 1em 0;
      color: rgba(255, 255, 255, 0.7);
      font-size: 0.9rem;
    }

    .status-badges {
      display: flex;
      align-items: center;
      gap: 0.5em;
      width: fit-content;
    }
  `

  const [ brokenReason, isRecoverable ] = getBrokenReason(pkg)

  const handleRollback = async () => {
    try {
      const result = await rollbackPup(pkg.state!.id);
      if (result.jobId) {
        createAlert('neutral', `Rolling back ${pkg.state?.manifest?.meta?.name}...`, 'arrow-counterclockwise', 5000);
      }
    } catch (error) {
      console.error('Rollback failed:', error);
      createAlert('danger', `Rollback failed: ${(error as Error).message}`, 'exclamation-triangle', 0);
    }
  };

  return html`
    ${installationId === "uninstalled" || installationId === "broken"
      ? html`<span class="status-label ${installationId}">${installationLabel}</span>`
      : isInstallationLoadingStatus
        ? html`<span class="status-label ${installationId}">${installationLabel}</span>`
        : html`<span class="status-label ${statusId}">${statusLabel}</span>`
    }

    ${unavailableFromSource ? html`
      <div class="status-badges">
        <sl-tag pill variant="warning">Unavailable from Source</sl-tag>
      </div>
    ` : nothing}

    ${installationId === "broken"
      ? html`
        <sl-alert variant="danger" open style="margin-top: 1em;">
          <h3>${isRecoverable ?
            "Please uninstall this pup and try again. If the issue persists, please join the Dogebox discord and ask for support." :
            "There is an issue with this pup, unfortunately re-installing won't help in this case. Please reach out to the maintainers of this pup for support."}
          </h3>

          <br />
          Error Message: ${brokenReason}<br />
          Error Code: ${pkg.state?.brokenReason}
        </sl-alert>

        ${rollbackAvailable ? html`
          <div class="rollback-section">
            <h4><sl-icon name="arrow-counterclockwise"></sl-icon> Rollback Available</h4>
            <p>This failure occurred during an upgrade. You can attempt to rollback to the previous working version.</p>
            <sl-button variant="warning" size="small" @click=${handleRollback}>
              <sl-icon slot="prefix" name="arrow-counterclockwise"></sl-icon>
              Rollback to Previous Version
            </sl-button>
          </div>
        ` : nothing}
      `
      : nothing
    }
    <style>${styles}</style>
  `
};

/**
 * Returns a pretty string to show to the user, and a boolean of whether this is a recoverable error or not.
 * @returns {[string, boolean]}
 */
function getBrokenReason(pkg: EnrichedPup): [string, boolean] {
  // Widened to string: older backends emitted reasons (e.g. manifest_load_failed)
  // that are no longer in the BrokenReason union.
  switch(pkg.state?.brokenReason as string | undefined) {
    case "state_update_failed": {
      return [ "We were unable to update the state for this pup.", true ]
    }
    case "download_failed": {
      return [ "We were unable to download this pup.", true ]
    }
    case "nix_file_missing": {
      return [ "We were unable to find the nix file for this pup.", false ]
    }
    case "nix_hash_mismatch": {
      return [ "The pup manifest has an incorrect nix hash", false ]
    }
    case "delegate_key_write_failed": {
      return [ "We were unable to write the delegate key for this pup.", true ]
    }
    case "enable_failed": {
      return [ "We were unable to enable this pup.", true ]
    }
    case "nix_apply_failed": {
      return [ "We were unable to build this pup.", false ]
    }
    case "manifest_load_failed": {
      return [ "We were unable to load the pup manifest.", true ]
    }
    case "storage_creation_failed": {
      return [ "We were unable to create storage for this pup.", true ]
    }
    default: {
      return [ "An unknown error occurred.", true ]
    }
  }
}
