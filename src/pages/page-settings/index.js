import {
  LitElement,
  html,
  css,
  choose,
} from "/vendor/@lit/all@3.1.2/lit-all.min.js";
import "/components/common/action-row/action-row.js";
import "/components/views/action-check-updates/index.js";
import "/components/views/action-remote-access/index.js";
import { notYet } from "/components/common/not-yet-implemented.js";
import { store } from "/state/store.js";
import { StoreSubscriber } from "/state/subscribe.js";
import { getRouter } from "/router/index.js";
import { promptPowerOff, promptReboot } from "./power-helpers.js";

class SettingsPage extends LitElement {
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
  `;

  constructor() {
    super();
    this.context = new StoreSubscriber(this, store);
  }

  handleDialogClose() {
    store.updateState({ dialogContext: { name: null }});
    const router = getRouter();
    router.go('/settings', { replace: true });
  }

  render() {
    const { updateAvailable } = store.getContext('sys')
    const dialog = store.getContext('dialog')
    const hasSettingsDialog = ["updates", "versions", "remote-access"].includes(dialog.name);
    return html`
      <div class="padded">
        <section>
          <div class="section-title">
            <h3>Menu</h3>
          </div>
          <div class="list-wrap">
            <action-row prefix="info-circle" label="Version" href="/settings/versions" @click=${notYet}>
              View version details
            </action-row>
            <action-row prefix="arrow-repeat" ?dot=${updateAvailable} label="Updates" href="/settings/updates">
              Check for updates
            </action-row>
            <action-row prefix="wifi" label="Wifi" @click=${notYet}>
              Add or remove Wifi networks
            </action-row>
            <action-row prefix="key" label="Remote Access" href="/settings/remote-access" @click=${notYet}>
              Manage SSH settings and keys
            </action-row>
          <div class="list-wrap">
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
      </div>

      <sl-dialog no-header
        ?open=${hasSettingsDialog} @sl-request-close=${this.handleDialogClose}>
        ${choose(dialog.name, [
          ["updates", () => html`<x-action-check-updates></x-action-check-updates>`],
          ["remote-access", () => html`<x-action-remote-access></x-action-remote-access>`],
          ["versions", () => renderVersionsDialog(store, this.handleDialogClose)],
        ])}
      </sl-dialog>
    `;
  }
}

customElements.define("x-page-settings", SettingsPage);

function renderVersionsDialog(store, closeFn) {
  const { dbxVersion } = store.getContext('app')
  return html`
    <div style="text-align: center;">
      <h1>Versions</h1>

      <div style="text-align: left; margin-bottom: 1em;">
        <action-row prefix="box" expandable label="Dogebox ${dbxVersion}">
          Bundles Dogeboxd, DKM & dPanel
          <div slot="hidden"><small style="line-height: 1.1; display: block;">Lorem ad ex nostrud magna nisi ea enim magna exercitation aliquip enim amet ad deserunt sit irure aute proident.</div>
        </action-row>
      </div>

      <sl-button variant="text" @click=${closeFn}>Dismiss</sl-button>
    </div>
  `
}