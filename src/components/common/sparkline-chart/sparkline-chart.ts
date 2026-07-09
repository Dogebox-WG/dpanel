import { LitElement, html, css } from '/lib/lit-all.js';
import sparkline from '@fnando/sparkline';
import { generateMockSparklineData } from './mocks/sparkline.mocks.js';

interface SparklinePoint {
  date: string;
  value: number;
}

interface SparklineOptions {
  onmousemove?: (event: MouseEvent, datapoint: SparklinePoint | undefined) => void;
  onmouseout?: (event?: Event) => void;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

class SparklineChart extends LitElement {
  static properties = {
    data: { type: Array },
    label: { type: String },
    disabled: { type: Boolean },
    mock: { type: Boolean }
  };

  declare data: SparklinePoint[];
  declare label: string | undefined;
  declare disabled: boolean | undefined;
  declare mock: boolean | undefined;
  dataToUse: SparklinePoint[];
  options: SparklineOptions;

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
      stroke: #ffbd11;
    }

    .sparkline--spot {
      fill: white;
      stroke: white;
    }
  `;

  constructor() {
    super();
    this.dataToUse = [];
    this.options = {
      onmousemove: (event, datapoint) => {
        if (this.disabled || !datapoint) return;
        const tooltip = this.shadowRoot?.querySelector<HTMLElement>('.tooltip');
        if (!tooltip) return;

        tooltip.style.display = 'block';
        tooltip.textContent = `${datapoint.date}: ${datapoint.value}%`;
        tooltip.style.top = `${event.offsetY}px`;
        tooltip.style.left = `${event.offsetX + 20}px`;
      },
      onmouseout: () => {
        if (this.disabled) return;
        const tooltip = this.shadowRoot?.querySelector<HTMLElement>('.tooltip');
        if (!tooltip) return;
        tooltip.style.display = 'none';
      }
    };
  }

  render() {
    const fill = this.disabled ? "rgba(255, 255, 255, 0.1)" :"rgb(7, 255, 174, 0.2)"
    return html`
      ${this.label ? html`<span class="label" ?disabled=${this.disabled}>${this.label}</span>` : ''}
      <svg
        part="sparkline-svg"
        width="100" height="30" // Adjust size as needed
        stroke-width="2"
        stroke="${this.disabled ? 'grey' : 'rgb(7, 255, 174)'}"
        fill="${fill}"
        @mousemove="${this.handleMouseMove}"
        @mouseout="${this.handleMouseOut}">
      </svg>
      <div class="tooltip"></div>
    `;
  }

  handleMouseMove(event: MouseEvent) {
    // Delegate to sparkline's mousemove handler if options are set
    if (this.options.onmousemove) {
      // The sparkline lib may attach an index to the event detail; DOM
      // MouseEvents expose detail as a number, so narrow before reading it.
      const detail: unknown = event.detail;
      const index =
        isRecord(detail) && typeof detail.index === 'number'
          ? detail.index
          : undefined;
      const datapoint = index !== undefined ? this.dataToUse[index] : undefined;
      this.options.onmousemove(event, datapoint);
    }
  }

  handleMouseOut(event: Event) {
    // Delegate to sparkline's mouseout handler if options are set
    if (this.options.onmouseout) {
      this.options.onmouseout(event);
    }
  }

  updated(changedProperties: Map<PropertyKey, unknown>) {
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

    const svg = this.shadowRoot?.querySelector<SVGSVGElement>('svg[part="sparkline-svg"]');
    if (!svg) return;
    // Pass options to the sparkline function
    sparkline(svg, this.dataToUse, this.options);
  }
}

customElements.define('sparkline-chart', SparklineChart);