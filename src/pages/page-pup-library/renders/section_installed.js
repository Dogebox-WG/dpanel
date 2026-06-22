import { html, css, nothing, repeat } from '/vendor/@lit/all@3.1.2/lit-all.min.js';

var pupCardGrid = css`
  .pup-card-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  }
`

export function renderSectionInstalledHeader(ready) {


  return html`
    <!-- div class="heading-wrap">
      ${this.fetchLoading ? html`
        <sl-spinner></sl-spinner>
      ` : nothing }

      ${ready ? html`
        <sl-tag pill>${this.installedList.data.length}</sl-tag>
      ` : nothing }
    </div -->

    <!-- div class="actions">
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
    </div -->
  `
}

export function renderSectionInstalledBody(ready, SKELS, hasItems) {

  return html`
    ${this.fetchLoading ? html`
      <div class="details-group">
        ${repeat(SKELS, (_, index) => index, () => html`
          <pup-snapshot-skeleton></pup-snapshot-skeleton>
        `)}
      </div>
    ` : nothing }

    ${ready && !hasItems('installed') ? html`
      <div class="empty">
        Such empty.<br>
        No pups available in this repository.
      </div>
      ` : nothing 
    }

    ${ready && hasItems('installed') ? html`
      <div class="pup-card-grid">
        ${repeat(this.installedList.getCurrentPageData(), (pkg) => `${pkg.state.id}-${pkg.state.version}`, (pkg) => {
          return html`
            <pup-card
              defaultIcon="box"
              pupId=${pkg.state.id}
              pupName=${pkg.state.manifest.meta.name}
              version=${pkg.state.version}
              logoBase64=${pkg?.assets?.logos?.mainLogoBase64}
              status=${pkg.computed.statusLabel}
              ?sourceUnavailable=${pkg.computed?.unavailableFromSource || false}
              .upstreamVersions=${pkg.state.manifest?.meta?.upstreamVersions || {}}
              href=${pkg.computed.libraryURL}
              gref=${pkg.computed.pupURL}
              ?hasGui=${false}
            ></pup-card>
          `}
        )}
      </div>
      <style>${pupCardGrid}</style>

      `: nothing
    }
  `
}