import { html, css, classMap, nothing } from "/vendor/@lit/all@3.1.2/lit-all.min.js";
import "/components/common/pup-build-badge.js";

export function renderStatus() {
  const pupContext = this.context.store.pupContext
  const pkg = this.getPup();

  const installationId = pkg?.computed?.installationId;
  const installationLabel = pkg?.computed?.installationLabel;

  const isInstalled = installationId === 'ready' && pkg.computed.isInstalled;
  const isBroken = installationId === 'broken';
  const isLoadingStatus = ["installing"].includes(installationId);
  const manifest = pkg.def.versions[pkg.def.latestVersion];

  const installationLabelClass = classMap({
    "installed": installationLabel === 'Ready',
    "not_installed": installationLabel === 'Not Installed',
    "broken": installationLabel === 'Broken',
  })

  return html`
    <div style="display: flex; flex-direction: row; gap: 1em; margin-bottom: 1em;">
      ${pkg.def.logoBase64 ? html`<img style="width: 82px; height: 82px;" src="${pkg.def.logoBase64}" />` : nothing}
      <div style="width: 100%;">
        <div class="section-title">
          <h3 class="installation-label ${installationLabelClass}">${installationLabel}</h3>
        </div>
        <div>
          <div class="status-heading">
            <span class="status-label">${manifest.meta.name}</span>
            <pup-build-badge .manifest=${manifest}></pup-build-badge>
          </div>
          <sl-progress-bar class="loading-bar" value="0" ?indeterminate=${isLoadingStatus}></sl-progress-bar>
        </div>
      </div>
    </div>
    <style>${styles}</style>
  `
};

const styles = css`
  .status-label {
    font-size: 2em;
    line-height: 1.5;
    display: block;
    padding-bottom: 0.5rem;
    font-family: 'Comic Neue';
    text-transform: capitalize;
  }

  .status-heading {
    display: flex;
    align-items: center;
    gap: 0.75em;
    flex-wrap: wrap;
    padding-bottom: 0.5rem;
  }

  .status-heading .status-label {
    padding-bottom: 0;
  }

  .loading-bar {
    --indicator-color:var(--sl-color-amber-700);
    --height: 1px;
  }

  .wrapper section.status .section-title h3 {
    font-weight: 100;
    color: var(--sl-color-warning-700);

    &.installing { color: var(--sl-color-warning-700); }
    &.installed { color: rgb(0, 195, 255); }
    &.broken { color: #fe5c5c; }
  }

  .wrapper.installed section.status .section-title h3 {
    color: #00c3ff;
  }
`