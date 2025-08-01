import { html, css, classMap, nothing } from "/vendor/@lit/all@3.1.2/lit-all.min.js";

export function renderStatus(labels, pkg) {
  let { statusId, statusLabel, installationId, installationLabel } = labels;
  const isInstallationLoadingStatus = ["uninstalling", "purging"].includes(installationId)

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
      &.uninstalling { color: var(--sl-color-danger-600); }
      &.uninstalled { color: var(--sl-color-danger-600); }
      &.purging { color: var(--sl-color-danger-600); }
    }
  `

  const [ brokenReason, isRecoverable ] = getBrokenReason(pkg)

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
    default: {
      return [ "An unknown error occurred.", true ]
    }
  }
}