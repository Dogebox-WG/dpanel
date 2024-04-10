import { html, nothing } from '/vendor/@lit/all@3.1.2/lit-all.min.js';

export function renderSectionConfig() {
  return html`
    <sl-tab slot="nav" panel="config">Config</sl-tab>
    <sl-tab-panel name="config">
      <dynamic-form
        pupId=${this.pupId}
        .fields=${this.config}
        .values=${this.options}
        orientation="landscape">
      </dynamic-form>
    </sl-tab-panel>
  `
}
