import { html } from '/lib/lit-all.js';

export function renderSectionStats(this: unknown) {
  return html`
    <sl-tab slot="nav" panel="stats">Stats</sl-tab>
    <sl-tab-panel name="stats">
      This is the stats tab panel.
    </sl-tab-panel>
  `  
}
