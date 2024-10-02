import { html, css, nothing } from "/vendor/@lit/all@3.1.2/lit-all.min.js";
import { doBootstrap } from "/api/bootstrap/bootstrap.js";

export function openConfig() {
  this.open_dialog = "configure";
  this.open_dialog_label = "Configure";
}

export function openDeps() {
  this.open_dialog = "deps";
  this.open_dialog_label = "Dependencies";
}

export async function handlePurgeFunction() {
  this.inflight_purge = true;
  const pupId = this.getPup().state.id
  this.requestUpdate();

  const callbacks = {
    onSuccess: async () => {
      await doBootstrap();
      this.inflight_purge = false;
      window.location.href = window.location.origin + "/pups";
    },
    onError: async () => {
      await doBootstrap();
      this.inflight_purge = false;
    },
    onTimeout: async () => {
      await doBootstrap();
      window.location.href = window.location.origin + "/pups";
      this.inflight_purge = false;
    }
  }
  await this.pkgController.requestPupAction(pupId, 'purge', callbacks);
}

export function renderActions(labels) {
  const pkg = this.getPup();
  let { installationId, statusId, statusLabel } = labels

  const hasButtons =
    ["needs_deps", "needs_config"].includes(statusId)
    || ["uninstalled"].includes(installationId)
    || pkg.state.manifest?.gui;

  const styles = css`
    .action-wrap {
      display: flex;
      flex-direction: row;
      flex-wrap: wrap;
      gap: 1em;

      &.margin {
        margin-top: 1.2em;
      }
    }

    .show-only-wide {
      display: none;
      @media (min-width: 800px) {
        display: inline-block;
      }
    }
  `

  const uiButtons = pkg.state.webUIs.map((entry) => {
    return html`
      <div style="display: flex; align-items: center;">
        <sl-button
          size="large"
          variant="warning"
          ?disabled="${statusId !== 'running'}"
          @click=${() => {
            window.open(`${window.location.protocol}//${window.location.hostname}:${entry.port}/`, "_blank");
          }}
        ">
          <sl-icon slot="prefix" name="stars"></sl-icon>
          Launch ${entry.name}
        </sl-button>
      </div>
    `
  })

  const uiButtonsDiv = uiButtons.length > 0 ? html`
    <div style="display: flex; flex-wrap: wrap;gap: 1em;align-items: center; margin-top: 20px;">
      ${uiButtons}
    </div>
  ` : nothing

  return html`
    <div class="action-wrap ${hasButtons ? "margin" : ""}">

      ${statusId === 'needs_config' ? html`
        <sl-button variant="warning" size="large" @click=${this.openConfig}>
          <sl-icon slot="prefix" name="gear"></sl-icon>
          Configure
        </sl-button>
      ` : nothing }

      ${statusId === 'needs_deps' ? html`
        <sl-button variant="warning" size="large" name="deps" label="dependencies" @click=${this.openDeps}>
          Resolve Now
        </sl-button>
      ` : nothing }

      ${installationId === 'uninstalled' ? html`
        <sl-button variant="danger" outline size="large" @click=${this.handlePurgeFunction}>
          Cleanup storage
        </sl-button>
      ` : nothing }

      ${uiButtonsDiv}
    </div>
    <style>${styles}</style>
  `
};
