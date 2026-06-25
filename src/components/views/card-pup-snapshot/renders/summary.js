import { html } from '/lib/lit-all.js';

export function renderSummary() {
  return html`
    <div class="summary-section summary-section-title">
      ${this.renderSummaryTitle()}
    </div>

    <div class="summary-section summary-section-charts">
      ${this.installed && this.allowManage && this.renderSummaryCharts()}
    </div>

    <div class="summary-section summary-section-actions">
      ${this.renderSummaryActions()}
    </div>
  `
}