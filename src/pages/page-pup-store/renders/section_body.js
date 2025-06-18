import { html, css, nothing, repeat } from '/vendor/@lit/all@3.1.2/lit-all.min.js';

var pupCardGrid = css`
  .pup-card-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
    @media (min-width:576px) {
      grid-template-columns: repeat(auto-fit, minmax(576px, 1fr));
    }
  }
`

export function renderSectionHeader(ready) {

  return html`
    <div class="actions">
      <sl-dropdown>
        <sl-button slot="trigger" ?disabled=${this.busy}><sl-icon name="three-dots-vertical"></sl-icon></sl-button>
        <sl-menu @sl-select=${this.handleActionsMenuSelect}>
          <sl-menu-item>
            Repository
            <sl-menu slot="submenu">
              <sl-menu-item value="repository-local">Local</sl-menu-item>
              <sl-menu-item value="repository-remote-a">Remote A</sl-menu-item>
              <sl-menu-item value="repository-remote-b">Remote B</sl-menu-item>
              <sl-menu-item value="repository-remote-c">Remote C</sl-menu-item>
            </sl-menu>
          </sl-menu-item>
          <sl-menu-item value="refresh">Refresh</sl-menu-item>
        </sl-menu>
      </sl-dropdown>
    </div>
  `
}

export function renderSectionBody(ready, SKELS, hasItems) {
  return html`
    ${this.fetchLoading ? html`
      <div class="details-group">
        ${repeat(SKELS, (_, index) => index, () => html`
          <pup-snapshot-skeleton></pup-snapshot-skeleton>
        `)}
      </div>
    ` : nothing }

    ${ready && !hasItems('packages') ? html`
      <div class="empty">
        Such empty.<br>
        No pups available in this repository.
      </div>
      ` : nothing 
    }

    ${ready && hasItems('packages') ? html`
      <div class="pup-card-grid">
        ${repeat(this.packageList.getCurrentPageData(), (pkg) => `${pkg.def.source?.id || 'unknown'}-${pkg.def.key}`, (pkg) => {
          return html`
          <pup-install-card
            defaultIcon="box"
            sourceId=${pkg.def.source.id}
            defKey=${pkg.def.key}
            pupName=${pkg.def.key}
            version=${pkg.def.latestVersion}
            logoBase64=${pkg.def.logoBase64}
            .upstreamVersions=${pkg.def.versions[pkg.def.latestVersion]?.meta?.upstreamVersions || {}}
            short="${pkg.def.versions[pkg.def.latestVersion]?.meta?.shortDescription}"
            ?installed=${pkg.computed.isInstalled}
            ?updateAvailable=""
            href=${pkg.computed.storeURL}
            .source=${pkg.def.source}
            .installationState=${{ id: pkg.computed.installationId, label: pkg.computed.installationLabel }}
          ></pup-install-card>
        `})}
      </div>
      <style>${pupCardGrid}</style>

      <paginator-ui
        ?disabled=${this.busy}
        @go-next=${this.packageList.nextPage}
        @go-prev=${this.packageList.previousPage}
        currentPage=${this.packageList.currentPage}
        totalPages=${this.packageList.getTotalPages()}
      ></paginator-ui>

      `: nothing
    }
  `
}
