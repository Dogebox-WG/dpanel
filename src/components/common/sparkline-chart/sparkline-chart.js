import { LitElement, html, css } from '/vendor/@lit/all@3.1.2/lit-all.min.js';
import { sparkline } from '/vendor/@fnando/sparkline@0.3.10/sparkline.js';
import { generateMockSparklineData } from './mocks/sparkline.mocks.js';

class SparklineChart extends LitElement {
  static properties = {
    data: { type: Array },
    label: { type: String },
    disabled: { type: Boolean },
    mock: { type: Boolean }
  };

  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      position: relative;
    }
    svg {
      width: auto;
      height: 30px;
    }
    .tooltip {
      position: absolute;
      background: rgba(0, 0, 0, .7);
      color: #fff;
      padding: 2px 5px;
      font-size: 12px;
      white-space: nowrap;
      z-index: 9999;
      display: none; // Start hidden
    }
    .label {
      font-size: var(--sl-font-size-x-small);
    }

    .label[disabled] {
      color: grey;
    }

    .sparkline--cursor {
      stroke: orange;
    }

    .sparkline--spot {
      fill: red;
      stroke: red;
    }
  `;

  constructor() {
    super();
    this.dataToUse = [];
    this.options = {
      onmousemove: (event, datapoint) => {
        if (this.disabled || !datapoint) return;
        const tooltip = this.shadowRoot.querySelector('.tooltip');
        
        tooltip.style.display = 'block';
        tooltip.textContent = `${datapoint.date}: ${datapoint.value}%`;
        tooltip.style.top = `${event.offsetY}px`;
        tooltip.style.left = `${event.offsetX + 20}px`;
      },
      onmouseout: () => {
        if (this.disabled) return;
        const tooltip = this.shadowRoot.querySelector('.tooltip');
        tooltip.style.display = 'none';
      }
    };
  }

  render() {
    const fill = this.disabled ? "rgba(255, 255, 255, 0.1)" :"rgba(0, 0, 255, .2)"
    return html`
      ${this.label ? html`<span class="label" ?disabled=${this.disabled}>${this.label}</span>` : ''}
      <svg
        part="sparkline-svg"
        width="100" height="30" // Adjust size as needed
        stroke-width="2"
        stroke="${this.disabled ? 'grey' : 'blue'}"
        fill="${fill}"
        @mousemove="${this.handleMouseMove}"
        @mouseout="${this.handleMouseOut}">
      </svg>
      <div class="tooltip"></div>
    `;
  }

  handleMouseMove(event) {
    // Delegate to sparkline's mousemove handler if options are set
    if (this.options.onmousemove) {
      const datapoint = this.dataToUse[event.detail.index];
      this.options.onmousemove(event, datapoint);
    }
  }

  handleMouseOut(event) {
    // Delegate to sparkline's mouseout handler if options are set
    if (this.options.onmouseout) {
      this.options.onmouseout(event);
    }
  }

  updated(changedProperties) {
    if (changedProperties.has('data') || changedProperties.has('mock')) {
      this.drawSparkline();
    }
  }

  drawSparkline() {
    this.dataToUse = this.data;
    // Check if mock is true, if so use the generated mock data
    if (this.mock) {
      const mockDataCount = 10; // Set the desired count for mock data items
      this.dataToUse = generateMockSparklineData(mockDataCount);
    }

    const svg = this.shadowRoot.querySelector('svg[part="sparkline-svg"]');
    // Pass options to the sparkline function
    sparkline(svg, this.dataToUse, this.options);
  }
}

customElements.define('sparkline-chart', SparklineChart);