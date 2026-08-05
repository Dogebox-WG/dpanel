import { html, unsafeHTML } from '/lib/lit-all.js';
import type { PupSnapshot } from '../index.js';

export function renderSectionDesc(this: PupSnapshot) {
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
