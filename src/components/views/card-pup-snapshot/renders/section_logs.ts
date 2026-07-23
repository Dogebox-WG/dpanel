import { html, nothing } from '/lib/lit-all.js';
import type { PupSnapshot } from '../index.js';

export function renderSectionLogs(this: PupSnapshot) {
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
