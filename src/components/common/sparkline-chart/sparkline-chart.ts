import { LitElement, html, css } from '/lib/lit-all.js';
import sparkline from '@fnando/sparkline';
import { generateMockSparklineData } from './mocks/sparkline.mocks.js';

/** A normalized chart point; ts is epoch ms, seconds, or a date string. */
interface SparkPoint {
  value: number;
  ts?: number | string;
}

/** A chart point with the coordinates added by the sparkline library. */
interface SparklineDatapoint extends SparkPoint {
  index: number;
  x: number;
  y: number;
}

function isSparklineRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isIterable(value: unknown): value is Iterable<unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    Symbol.iterator in value &&
    typeof value[Symbol.iterator] === 'function'
  );
}

interface SparklineOptions {
  onmousemove: (event: MouseEvent, datapoint: SparklineDatapoint) => void;
  onmouseout: () => void;
  interactive: boolean;
}

class SparklineChart extends LitElement {
  static properties = {
    // accept real JS values only (no attribute deserialization)
    data: { attribute: false },
    label: { type: String },
    unit: { type: String },
    disabled: { type: Boolean },
    mock: { type: Boolean }
  };

  declare data: unknown;
  declare label: string | undefined;
  declare unit: string | undefined;
  declare disabled: boolean | undefined;
  declare mock: boolean | undefined;
  _timestamps: (number | string | null)[];
  /** Synthesized timestamp spacing (ms) when data has no timestamps. */
  readonly _fallbackStepMs: number;
  readonly options: SparklineOptions;
  readonly resizeObserver: ResizeObserver;

  static styles = css`
    :host {
      display: block;
      position: relative;
    }
    .label {
      display: block;
      font-size: var(--sl-font-size-x-small);
    }
    .label[disabled] {
      color: grey;
    }
    /* Parent can override --sparkline-height; fallback keeps layout stable */
    svg {
      width: 100%;
      height: var(--sparkline-height, 160px);
      display: block;
      background: transparent;
      shape-rendering: geometricPrecision;
      overflow: hidden;
    }
    .tooltip {
      position: fixed;
      background: rgba(0, 0, 0, 0.85);
      color: white;
      font-family: monospace;
      font-size: 12px;
      padding: 6px 8px;
      border-radius: 4px;
      white-space: nowrap;
      width: max-content;
      max-width: 360px;
      line-height: 1.4;
      z-index: 99999;
      display: none;
      pointer-events: none;
      box-shadow: 0 4px 12px rgba(0,0,0,0.6);
      overflow-wrap: normal;
      word-break: normal;
      user-select: text;
    }
    .tooltip-timestamp {
      opacity: 0.8;
      font-size: 11px;
    }
    .sparkline--cursor {
      stroke: #ffbd11;
      stroke-width: 1.5;
    }
    .sparkline--spot {
      fill: white;
      stroke: white;
      r: 3;
    }
    path {
      stroke-width: 2;
    }
  `;

  constructor() {
    super();
    this._timestamps = [];
    // When no timestamps are supplied, synthesize them at this interval (ms).
    // Your monitor currently pushes every 10s.
    this._fallbackStepMs = 10_000;

    this.options = {
      onmousemove: (event, datapoint) => {
        if (this.disabled) return;
        const tooltip = this.shadowRoot?.querySelector<HTMLElement>('.tooltip');
        if (!tooltip) return;
        const value = tooltip.querySelector<HTMLElement>('.tooltip-value');
        const timestamp = tooltip.querySelector<HTMLElement>('.tooltip-timestamp');
        if (!value || !timestamp) return;

        const ts = this._timestamps[datapoint.index];
        value.textContent = `Value: ${datapoint.value}${this.unit ?? ''}`;
        timestamp.textContent = this._fmtTs(ts);

        tooltip.style.display = 'block';

        // Position relative to viewport so it is not clipped by the metric card
        const pad = 12;
        let x = (event.clientX || 0) + pad;
        let y = (event.clientY || 0) + pad;

        tooltip.style.left = `${x}px`;
        tooltip.style.top = `${y}px`;

        // Clamp to viewport (measure after display)
        const r = tooltip.getBoundingClientRect();
        const maxX = window.innerWidth - r.width - pad;
        const maxY = window.innerHeight - r.height - pad;

        if (x > maxX) x = maxX;
        if (y > maxY) y = maxY;
        if (x < pad) x = pad;
        if (y < pad) y = pad;

        tooltip.style.left = `${x}px`;
        tooltip.style.top = `${y}px`;
      },
      onmouseout: () => {
        const tooltip = this.shadowRoot?.querySelector<HTMLElement>('.tooltip');
        if (tooltip) tooltip.style.display = 'none';
      },
      interactive: true
    };

    this.resizeObserver = new ResizeObserver(() => {
      requestAnimationFrame(() => this.drawSparkline());
    });
  }

  connectedCallback() {
    super.connectedCallback();
    this.resizeObserver.observe(this);
  }
  disconnectedCallback() {
    this.resizeObserver.disconnect();
    super.disconnectedCallback();
  }

  render() {
    const fill = this.disabled ? 'rgba(255, 255, 255, 0.1)' : 'rgba(7, 255, 174, 0.2)';
    return html`
      ${this.label ? html`<span class="label" ?disabled=${this.disabled}>${this.label}</span>` : ''}
      <svg
        part="sparkline-svg"
        preserveAspectRatio="none"
        stroke-width="2"
        stroke="${this.disabled ? 'grey' : 'rgb(7, 255, 174)'}"
        fill="${fill}">
      </svg>
      <div class="tooltip">
        <div class="tooltip-value"></div>
        <div class="tooltip-timestamp"></div>
      </div>
    `;
  }

  updated(changed: Map<PropertyKey, unknown>) {
    super.updated(changed);
    if (changed.has('data') || changed.has('mock')) {
      this.drawSparkline();
    }
    if (changed.has('disabled') && this.disabled) {
      const tooltip = this.shadowRoot?.querySelector<HTMLElement>('.tooltip');
      if (tooltip) tooltip.style.display = 'none';
    }
  }

  drawSparkline() {
    // Normalize into [{ value, ts? }, ...]
    const toPoints = (arrLike: unknown): SparkPoint[] => {
      if (!arrLike) return [];
      if (typeof arrLike === 'string') {
        try { arrLike = JSON.parse(arrLike); } catch { /* ignore */ }
      }

      const points: SparkPoint[] = [];
      const tsKeys = ['ts','time','timestamp','date','t'];

      const pickTs = (obj: Record<string, unknown> | null | undefined) => {
        if (!obj) return undefined;
        const k = tsKeys.find(k => obj[k] != null);
        return k ? obj[k] : undefined;
      };

      const source: Iterable<unknown> = isIterable(arrLike) ? arrLike : [];
      for (const item of source) {
        let v: unknown, tVal: unknown;

        if (Array.isArray(item) && item.length >= 2) {
          // [timestamp, value]
          tVal = item[0];
          v = item[1];
        } else if (isSparklineRecord(item)) {
          // { value, ts/time/timestamp/... }
          const key = ['value','v','n','val','y','x'].find(k => item[k] != null);
          v = key ? item[key] : item;
          tVal = pickTs(item);
          if (tVal == null && isSparklineRecord(item.meta)) tVal = pickTs(item.meta);
        } else {
          // primitive number/string
          v = item;
        }

        if (typeof v === 'string') v = v.replace(/[,\s%]/g, '');
        const n = Number(v);
        if (Number.isFinite(n)) {
          const p: SparkPoint = { value: n };
          if (tVal != null) p.ts = typeof tVal === 'number' ? tVal : String(tVal);
          points.push(p);
        }
      }

      return points.slice(-500);
    };

    const points = this.mock
      ? toPoints(generateMockSparklineData(10))
      : toPoints(this.data);

    const svg = this.shadowRoot?.querySelector<SVGSVGElement>('svg[part="sparkline-svg"]');
    if (!svg) return;

    // Clear and compute concrete size the lib can read (width/height attributes)
    svg.innerHTML = '';
    const width  = Math.max(this.getBoundingClientRect().width || svg.clientWidth || 0, 100);
    const height = Math.max(parseFloat(getComputedStyle(svg).height) || 0, 56);
    if (width <= 0 || height <= 0) return;

    // Width/height attributes are required by the sparkline lib
    svg.setAttribute('width', String(width));
    svg.setAttribute('height', String(height));
    if (!svg.hasAttribute('stroke-width')) svg.setAttribute('stroke-width', '2');

    // Need at least two points
    if (points.length < 2) {
      svg.innerHTML = '<text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="gray">-</text>';
      this._timestamps = points.map(p => p.ts ?? null);
      return;
    }

    // If incoming data has no timestamps at all, synthesize them (10s spacing).
    const hasAnyTs = points.some(p => p.ts !== undefined && String(p.ts) !== '');
    if (!hasAnyTs) {
      const step = this._fallbackStepMs;
      const start = Date.now() - step * (points.length - 1);
      points.forEach((p, i) => { p.ts = start + i * step; });
    }

    // Prevent zero-height y-range (flat series)
    const min = Math.min(...points.map(p => p.value));
    const max = Math.max(...points.map(p => p.value));
    if (min === max) {
      const eps = (Math.abs(min) || 1) * 1e-6;
      points[0].value -= eps;
      points[points.length - 1].value += eps;
    }

    this._timestamps = points.map(p => p.ts ?? null);

    try {
      sparkline(svg, points, this.options);
    } catch (e) {
      console.error('[sparkline] draw failed', { series: points, raw: this.data }, e);
      svg.innerHTML = '<text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="gray">-</text>';
    }
  }

  _fmtTs(ts: number | string | null | undefined) {
    if (ts == null || ts === '') return 'n/a';
    // If numeric-ish, decide seconds vs ms
    if (typeof ts === 'number' || (typeof ts === 'string' && ts.trim() !== '' && !Number.isNaN(Number(ts)))) {
      let n = Number(ts);
      if (!Number.isFinite(n)) return String(ts);
      if (n < 1e12) n = n * 1000; // assume seconds
      const d = new Date(n);
      return Number.isNaN(d.getTime()) ? String(ts) : d.toLocaleString();
    }
    const d = new Date(ts); // ISO string, etc.
    return Number.isNaN(d.getTime()) ? String(ts) : d.toLocaleString();
  }
}

customElements.define('sparkline-chart', SparklineChart);
