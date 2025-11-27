import {
  html,
  choose,
  unsafeHTML,
} from "/vendor/@lit/all@3.1.2/lit-all.min.js";

import "/components/views/action-dependency-manage/dependency.js";

export function renderDialog() {
  const pkg = this.getPup();
  const { statusId } = pkg.computed;
  const readmeEl = html`<div style="padding: 1em; text-align: center;"> Such empty. This pup does not provide a README.</div>`;
  const deps = pkg?.state?.manifest?.dependencies || [];
  const ints = pkg?.state?.manifest?.interfaces || [];
  const depsEl = html`<x-action-manage-deps .dependencies=${deps} .providers=${pkg.state.providers} editMode pupId=${pkg.state.id}></x-action-manage-deps>`;
  const intsEl = html`<x-action-interface-list .interfaces=${ints}></x-action-interface-list>`;

  const preventUninstallEl = html`
    <p>Cannot uninstall a running Pup.<br/>Please disable ${pkg.state.manifest.meta.name } and try again.</p>
    <sl-button slot="footer" variant="primary" @click=${this.clearDialog}>Dismiss</sl-button>
    <style>p:first-of-type { margin-top: 0px; }</style>
  `

  const uninstallEl = html`
    <p>Are you sure you want to uninstall ${pkg.state.manifest.meta.name}?</p>
    <sl-input 
      placeholder="Type '${pkg.state.manifest.meta.name}' to confirm" 
      @sl-input=${(e) => this._confirmedName = e.target.value }
      @keydown=${(e) => {
        if (e.key === 'Enter' && 
            this._confirmedName === pkg.state.manifest.meta.name && 
            !this.inflight_uninstall) {
          this.handleUninstall();
        }
      }}
      autofocus
      autocomplete="off"
    ></sl-input>
    <sl-button slot="footer" variant="danger" @click=${this.handleUninstall} ?loading=${this.inflight_uninstall} ?disabled=${this.inflight_uninstall || this._confirmedName !== pkg.state.manifest.meta.name}>Uninstall</sl-button>
    <style>p:first-of-type { margin-top: 0px; }</style>
  `;

  const configEl = html`
    <dynamic-form
      .values=${pkg?.state.config}
      .fields=${pkg?.state.manifest?.config}
      .onSubmit=${this.submitConfig}
      requireCommit
      markModifiedFields
      allowDiscardChanges
    >
    </dynamic-form>
  `;

  const isStopped = !this.pupEnabled && statusId !== "running";

  return html`
    ${choose(
      this.open_dialog,
      [
        ["readme", () => readmeEl],
        ["deps", () => depsEl],
        ["ints", () => intsEl],
        ["configure", () => configEl],
        ["uninstall", () => isStopped ? uninstallEl : preventUninstallEl],
      ],
      () => html`<span>View not provided: ${this.open_dialog}</span>`,
    )}
  `;
}

