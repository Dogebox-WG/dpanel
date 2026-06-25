import { html, unsafeHTML } from '/lib/lit-all.js';

export function renderSectionDesc() {
  return html`
    <sl-tab slot="nav" panel="about">About</sl-tab>
    <sl-tab-panel name="about">
      ${
        // TODO: replace with safe markdown renderer.
        this.docs && unsafeHTML(this.docs.about)
      }
    </sl-tab-panel>
  `
}
