import { html, nothing } from '/vendor/@lit/all@3.1.2/lit-all.min.js';

export function renderSectionLogs() {
  return html`
    <sl-tab slot="nav" panel="logs">Logs</sl-tab>
    <sl-tab-panel name="logs" style="--padding: 0;">
      ${this.inspected && this.activeTab === 'logs' ? html`
        <log-viewer ?autostart=${this.inspected}></log-viewer>
        `
      : nothing }
    </sl-tab-panel>
  `
}
