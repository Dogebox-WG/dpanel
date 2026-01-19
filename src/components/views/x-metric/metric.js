import { LitElement, html, css, choose } from '/vendor/@lit/all@3.1.2/lit-all.min.js';
import "/components/common/sparkline-chart/sparkline-chart-v2.js";

class MetricView extends LitElement {
  static properties = {
    metric: { type: Object, reflect: true },
    expand: { type: Boolean, reflect: true }
  }

  constructor() {
    super();
    this.metric = { values: [] };
    this.expand = false;
  }

  set metric(val) {
    let old = this._metric;
    this._metric = val;
    this.requestUpdate("metric", old);
  }

  get metric() {
    return this._metric;
  }

  render () {
    const type = this.metric.type || null;
    const desc = (this.metric.description ?? '').trim();
    const tip = desc || String(this.metric.label || this.metric.name || '');

    return html`
      <sl-tooltip .content=${tip} placement="top-start" hoist>
        <span class="label">${this.metric.label}</span>
      </sl-tooltip>

      <sl-copy-button
        class="copy"
        value="${this.metric.values}"
        @click=${(e) => e.stopPropagation()}>
      </sl-copy-button>

      <div class="value-container">
        ${choose(type, [
          ['int',   this.renderChart],
          ['float', this.renderChart],
          ['string', this.renderText]
        ], () => html`not supported`)}
      </div>
    `
  }

  renderChart = () => {
    const values = (this.metric.values || []).filter(Boolean);
    if (values.length < 2) return html`<span>-</span>`;

    return html`
      <sparkline-chart-v2
        style="width:100%; background:transparent; --sparkline-height: clamp(140px, 24vh, 220px);"
        .data=${values}
      </sparkline-chart-v2>
    `;
  }

  renderText = () => {
    const arr = this.metric.values || [];
    let value = arr[arr.length - 1];
    if (!value) value = '-';
    return html`<span class="string">${value}</span>`;
  }

  static styles = css`
    :host {
      position: relative;
      display: flex;
      position: relative;
      flex-direction: column;
      align-items: start;
      height: 100%;
      border-radius: 4px;
      padding: 1em;
      border: 1px solid #1d5145;
      width: 100%;
      box-sizing: border-box;
      overflow: hidden;
    }
    :host([expand]) {
      min-width: max-content;
    }

    .icon {
      padding: 2px 4px;
      border-radius: 4px;
      position: relative;
      top: 2px;
      left: -2px;
    }

    .label {
      font-size: 0.9rem;
      font-weight: 500;
      max-height: 1.5rem;
      line-height: 1.5rem;
    }
    .label:hover { cursor: help; }

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
      font-size: 0.9rem;
    }
    .value-container:has(sparkline-chart-v2) {
      align-items: stretch;
      flex: 1 1 auto;
      min-height: var(--sparkline-height, 160px);
    }
    .value-container > sparkline-chart-v2 {
      flex: 1 1 auto;
      min-height: 0;
      width: 100%;
    }

    .string {
      position: relative;
      display: block;
      max-width: 100%;
      white-space: pre-wrap;
      line-height: 1.2rem;
    }
    .string::after {
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
