import { html, css, nothing } from "/vendor/@lit/all@3.1.2/lit-all.min.js";
import { isInstallationLoadingState } from "../../../utils/installation-states.js";

export function renderStatus(labels, pkg) {
  let { statusId, statusLabel, installationId, installationLabel } = labels;

  const isInstallationLoadingStatus = isInstallationLoadingState(installationId);
  const isRecoverable = pkg.state.brokenReason?.includes("recoverable");
  const brokenReason = pkg.state.brokenReason || "Unknown error";

  return html`
    ${installationId?.toUpperCase() === "UNINSTALLED" || installationId?.toUpperCase() === "BROKEN"
      ? html`<span class="status-label ${installationId}">${installationLabel || "Unknown"}</span>`
      : isInstallationLoadingStatus
        ? html`<span class="status-label ${installationId}">${installationLabel || "Unknown"}</span>`
        : html`<span class="status-label ${statusId}">${statusLabel}</span>`
    }

    ${installationId?.toUpperCase() === "BROKEN"
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
}

const styles = css`
  .status-label {
    display: flex;
    align-items: center;
    gap: 0.5em;
    font-family: 'Comic Neue', sans-serif;
    font-size: 1.2em;
    line-height: 1.5;
    text-transform: capitalize;
  }

  .status-label.ready {
    color: var(--sl-color-success-500);
  }

  .status-label.installing,
  .status-label.uninstalling,
  .status-label.purging {
    color: var(--sl-color-neutral-500);
  }

  .status-label.broken {
    color: var(--sl-color-danger-500);
  }

  .status-label.uninstalled {
    color: var(--sl-color-neutral-500);
  }

  .status-label.unknown {
    color: var(--sl-color-neutral-500);
  }

  .loading-bar {
    --indicator-color: var(--sl-color-primary-500);
  }
`;
