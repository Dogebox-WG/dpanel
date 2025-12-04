import { html, css, classMap, nothing } from "/vendor/@lit/all@3.1.2/lit-all.min.js";
import { rollbackPup } from "/api/pup-updates/pup-updates.js";
import { createAlert } from "/components/common/alert.js";

export function renderStatus(labels, pkg) {
  let { statusId, statusLabel, installationId, installationLabel } = labels;
  const isInstallationLoadingStatus = ["uninstalling", "purging", "upgrading"].includes(installationId)

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
  `

  const [ brokenReason, isRecoverable ] = getBrokenReason(pkg)
  
  // Check if this broken state might be from a failed upgrade
  const mightBeUpgradeFailure = installationId === "broken" && 
    (pkg.state.brokenReason === "download_failed" || 
     pkg.state.brokenReason === "nix_apply_failed" ||
     pkg.state.brokenReason === "state_update_failed");

  const handleRollback = async () => {
    try {
      const result = await rollbackPup(pkg.state.id);
      if (result.jobId) {
        createAlert('neutral', `Rolling back ${pkg.state.manifest.meta.name}...`, 'arrow-counterclockwise', 5000);
      }
    } catch (error) {
      console.error('Rollback failed:', error);
      createAlert('danger', `Rollback failed: ${error.message}`, 'exclamation-triangle', 0);
    }
  };

  return html`
    ${installationId === "uninstalled" || installationId === "broken"
      ? html`<span class="status-label ${installationId}">${installationLabel}</span>`
      : isInstallationLoadingStatus
        ? html`<span class="status-label ${installationId}">${installationLabel}</span>`
        : html`<span class="status-label ${statusId}">${statusLabel}</span>`
    }

    ${installationId === "broken"
      ? html`
        <sl-alert variant="danger" open style="margin-top: 1em;">
          <h3>${isRecoverable ?
            "Please uninstall this pup and try again. If the issue persists, please join the Dogebox discord and ask for support." :
            "There is an issue with this pup, unfortunately re-installing won't help in this case. Please reach out to the maintainers of this pup for support."}
          </h3>

          <br />
          Error Message: ${brokenReason}<br />
          Error Code: ${pkg.state.brokenReason}
        </sl-alert>

        ${mightBeUpgradeFailure ? html`
          <div class="rollback-section">
            <h4><sl-icon name="arrow-counterclockwise"></sl-icon> Rollback Available</h4>
            <p>If this failure occurred during an upgrade, you can attempt to rollback to the previous working version.</p>
            <sl-button variant="warning" size="small" @click=${handleRollback}>
              <sl-icon slot="prefix" name="arrow-counterclockwise"></sl-icon>
              Rollback to Previous Version
            </sl-button>
          </div>
        ` : nothing}
      `
      : nothing
    }

    ${installationId === "upgrading" ? html`
      <sl-alert variant="neutral" open style="margin-top: 1em;">
        <sl-spinner slot="icon"></sl-spinner>
        <h4 style="margin: 0;">Upgrading...</h4>
        <p style="margin: 0.5em 0 0 0;">Please wait while the pup is being upgraded. This may take a few minutes.</p>
      </sl-alert>
    ` : nothing}

    <style>${styles}</style>
  `
};

/**
 * Returns a pretty string to show to the user, and a boolean of whether this is a recoverable error or not.
 * @returns {[string, boolean]}
 */
function getBrokenReason(pkg) {
  switch(pkg.state.brokenReason) {
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
