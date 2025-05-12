import { html, css, classMap, nothing } from "/vendor/@lit/all@3.1.2/lit-all.min.js";
import { getInstallationStateProperties, isInstallationLoadingState } from "../../../utils/installation-states.js";

export function renderStatus() {
  const pkg = this.getPup();

  const installationId = pkg?.computed?.installationId;
  const installationLabel = pkg?.computed?.installationLabel;
  const status = getInstallationStateProperties(installationId?.id);
  const isLoadingStatus = isInstallationLoadingState(installationId?.id);

  return html`
    <div style="display: flex; flex-direction: row; gap: 1em;">
      ${pkg.def.logoBase64 ? html`<img style="width: 82px; height: 82px;" src="${pkg.def.logoBase64}" />` : nothing}
      <div style="width: 100%;">
        <div class="section-title">
          <h3 class="installation-label ${status.class}">
            <sl-icon name="${status.icon}"></sl-icon>
            ${installationLabel || "Unknown"}
          </h3>
        </div>
        <div>
          <span class="status-label">${pkg.def.versions[pkg.def.latestVersion].meta.name}</span>
          <sl-progress-bar class="loading-bar" value="0" ?indeterminate=${isLoadingStatus}></sl-progress-bar>
        </div>
      </div>
    </div>
    <style>${styles}</style>
  `
}

const styles = css`
  .installation-label {
    display: flex;
    align-items: center;
    gap: 0.5em;
    margin: 0;
    font-family: 'Comic Neue', sans-serif;
  }

  .installation-label sl-icon {
    font-size: 1.2em;
  }

  .installation-label.installed {
    color: var(--sl-color-success-500);
  }

  .installation-label.installing,
  .installation-label.uninstalling {
    color: var(--sl-color-neutral-500);
  }

  .installation-label.broken {
    color: var(--sl-color-danger-500);
  }

  .installation-label.not_installed {
    color: var(--sl-color-neutral-500);
  }

  .installation-label.unknown {
    color: var(--sl-color-neutral-500);
  }

  .status-label {
    display: block;
    margin-bottom: 0.5em;
    font-family: 'Comic Neue', sans-serif;
    color: var(--sl-color-neutral-500);
  }

  .loading-bar {
    --indicator-color: var(--sl-color-primary-500);
  }
`;
