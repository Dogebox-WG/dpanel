import { LitElement, html, css, choose } from '/vendor/@lit/all@3.1.2/lit-all.min.js';
import "/components/common/sparkline-chart/sparkline-chart-v2.js";
import { canCopyToClipboard } from '/utils/clipboard.js';

class MetricView extends LitElement {
  static properties = {
    metric: { type: Object, reflect: true }
  }

  constructor() {
    super();
    this.metric = { values: [] };
  }

  set metric(val) {
    let old = this._metric;
    this._metric = val;
    this.requestUpdate("metric", old);
  }

  get metric() {
    return this._metric;
  }

  getMetricValues() {
    return Array.isArray(this.metric?.values) ? this.metric.values : [];
  }

  getNumericValues() {
    return this.getMetricValues().filter((value) => Number.isFinite(value));
  }

  getLatestValue() {
    const values = this.getMetricValues();
    const value = values[values.length - 1];
    return value === undefined || value === null || value === '' ? '-' : value;
  }

  resolveDisplayMode() {
    const type = this.metric?.type || null;
    if (type === 'int' || type === 'float') {
      return this.getNumericValues().length >= 2 ? 'chart' : 'value';
    }

    if (type === 'string') {
      return 'value';
    }

    return 'unsupported';
  }

  render () {
    const mode = this.resolveDisplayMode();
    const canCopy = canCopyToClipboard();

    return html`
      ${canCopy
        ? html`
            <sl-copy-button
              class="copy"
              value="${this.getMetricValues()}"
              @click=${(e) => e.stopPropagation()}>
            </sl-copy-button>
          `
        : ''}

      <div class="value-container ${mode}">
        ${choose(mode, [
          ['chart', this.renderChart],
          ['value', this.renderValue]
        ], () => html`not supported`)}
      </div>
    `
  }

  renderChart = () => {
    const values = this.getNumericValues();
    if (values.length < 2) return this.renderValue();

    return html`
      <sparkline-chart-v2
        style="width:100%; background:transparent; --sparkline-height: var(--metric-sparkline-height, clamp(140px, 24vh, 220px));"
        .data=${values}
      </sparkline-chart-v2>
    `;
  }

  renderValue = () => {
    return html`<span class="metric-value">${this.getLatestValue()}</span>`;
  }

  static styles = css`
    :host {
      position: relative;
      display: flex;
      position: relative;
      flex-direction: column;
      align-items: start;
      border-radius: 4px;
      padding: var(--metric-padding, 1em);
      border: 1px solid #1d5145;
      width: 100%;
      box-sizing: border-box;
      overflow: var(--metric-overflow, hidden);
    }

    .icon {
      padding: 2px 4px;
      border-radius: 4px;
      position: relative;
      top: 2px;
      left: -2px;
    }

    .value-container {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: flex-start;
      flex: 0 0 auto;
      min-height: 0;
      height: auto;
      background: transparent;
      font-family: Monospace;
      font-weight: normal;
      font-size: var(--metric-value-size, 0.9rem);
    }
    .value-container.chart {
      align-items: stretch;
      flex: 1 1 auto;
      min-height: var(--metric-sparkline-height, 160px);
    }

    .value-container.value {
      min-height: auto;
    }

    .value-container > sparkline-chart-v2 {
      flex: 1 1 auto;
      min-height: 0;
      width: 100%;
    }

    .metric-value {
      position: relative;
      display: block;
      max-width: 100%;
      white-space: pre-wrap;
      line-height: 1.2rem;
    }
    .metric-value::after {
      content: "";
      display: inline-block;
      position: absolute;
      bottom: 0px;
      left: 0px;
      width: 100%;
      height: 4px;
      background: linear-gradient(to bottom, transparent, #23252a);
    }

    .copy {
      position: absolute;
      right: 10px;
      top: 10px;
      z-index: 2;
    }
  `
}

customElements.define('x-metric', MetricView);
