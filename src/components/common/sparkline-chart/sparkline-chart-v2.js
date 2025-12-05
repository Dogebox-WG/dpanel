import { LitElement, html, css } from '/vendor/@lit/all@3.1.2/lit-all.min.js';
import { sparkline } from '/vendor/@fnando/sparkline@0.3.10/sparkline.js';
import { generateMockSparklineData } from './mocks/sparkline.mocks.js';

class SparklineChart extends LitElement {
  static properties = {
    // accept real JS values only (no attribute deserialization)
    data: { attribute: false },
    label: { type: String },
    title: { type: String }, // header/description shown in hover tooltip
    disabled: { type: Boolean },
    mock: { type: Boolean }
  };

  static styles = css`
    :host {
      display: block;
      position: relative;
    }
    .chart {
      display: flex;
      flex-direction: column;
      position: relative;
      border-bottom:1px solid #1d5145;
      width: 100%;
      overflow: hidden;
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
      position: absolute;
      background: rgba(0, 0, 0, 0.85);
      color: white;
      font-family: monospace;
      font-size: 12px;
      padding: 6px 8px;
      border-radius: 4px;
      white-space: normal;        /* allow wrapping for longer descriptions */
      max-width: 320px;           /* prevent very wide tooltips */
      line-height: 1.4;
      z-index: 9999;
      display: none;
      pointer-events: none;
      box-shadow: 0 4px 12px rgba(0,0,0,0.6);
      overflow-wrap: anywhere;
      user-select: text;
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
        if (this.disabled || datapoint == null) return;
        const tooltip = this.shadowRoot.querySelector('.tooltip');
        if (!tooltip) return;

        const val =
          typeof datapoint === 'number'
            ? datapoint
            : (datapoint.value ?? datapoint.y ?? datapoint.n);

        const idx =
          datapoint && Number.isInteger(datapoint.index) ? datapoint.index : 0;

        const ts = this._timestamps?.[idx];
        const tsLabel = this._fmtTs(ts);

        tooltip.style.display = 'block';

        tooltip.innerHTML =
          `Value: ${val}<br><span style="opacity:0.8; font-size:11px;">${tsLabel}</span>`;
        tooltip.style.top = `${event.offsetY}px`;
        tooltip.style.left = `${event.offsetX + 20}px`;
      },
      onmouseout: () => {
        if (this.disabled) return;
        const tooltip = this.shadowRoot.querySelector('.tooltip');
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
  firstUpdated() {
    this.drawSparkline();
  }

  render() {
    const fill = this.disabled ? "rgba(255, 255, 255, 0.1)" : "rgba(7, 255, 174, 0.2)";
    return html`
      <svg
        part="sparkline-svg"
        preserveAspectRatio="none"
        stroke-width="2"
        stroke="${this.disabled ? 'grey' : 'rgb(7, 255, 174)'}"
        fill="${fill}">
      </svg>
      <div class="tooltip"></div>
    `;
  }

  updated(changed) {
    super.updated(changed);
    if (changed.has('data') || changed.has('mock')) {
      setTimeout(() => this.drawSparkline(), 0);
    }
  }

  drawSparkline() {
    // Normalize into [{ value, ts? }, ...]
    const toPoints = (arrLike) => {
      if (!arrLike) return [];
      if (typeof arrLike === 'string') {
        try { arrLike = JSON.parse(arrLike); } catch { /* ignore */ }
      }

      const points = [];
      const tsKeys = ['ts','time','timestamp','date','t'];

      const pickTs = (obj) => {
        if (!obj) return undefined;
        const k = tsKeys.find(k => obj[k] != null);
        return k ? obj[k] : undefined;
      };

      for (const item of Array.from(arrLike)) {
        let v, tVal;

        if (Array.isArray(item) && item.length >= 2) {
          // [timestamp, value]
          tVal = item[0];
          v = item[1];
        } else if (item && typeof item === 'object') {
          // { value, ts/time/timestamp/... }
          const key = ['value','v','n','val','y','x'].find(k => item[k] != null);
          v = key ? item[key] : item;
          tVal = pickTs(item);
          if (tVal == null && item.meta) tVal = pickTs(item.meta);
        } else {
          // primitive number/string
          v = item;
        }

        if (typeof v === 'string') v = v.replace(/[,\s%]/g, '');
        const n = Number(v);
        if (Number.isFinite(n)) {
          const p = { value: n };
          if (tVal != null) p.ts = tVal;
          points.push(p);
        }
      }

      return points.slice(-500);
    };

    const points = this.mock
      ? toPoints(generateMockSparklineData(10))
      : toPoints(this.data);

    const svg = this.shadowRoot.querySelector('svg[part="sparkline-svg"]');
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
    const hasAnyTs = points.some(p => p.ts !== null && p.ts !== undefined && String(p.ts) !== '');
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

  _fmtTs(ts) {
    if (ts == null || ts === '') return 'n/a';
    // If numeric-ish, decide seconds vs ms
    if (typeof ts === 'number' || (typeof ts === 'string' && ts.trim !== undefined && ts.trim() !== '' && !isNaN(Number(ts)))) {
      let n = Number(ts);
      if (!Number.isFinite(n)) return String(ts);
      if (n < 1e12) n = n * 1000; // assume seconds
      const d = new Date(n);
      return isNaN(d.getTime()) ? String(ts) : d.toLocaleString();
    }
    const d = new Date(ts); // ISO string, etc.
    return isNaN(d.getTime()) ? String(ts) : d.toLocaleString();
  }
}

customElements.define('sparkline-chart-v2', SparklineChart);
