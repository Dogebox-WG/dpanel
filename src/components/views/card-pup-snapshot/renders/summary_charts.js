import { html, css } from '/vendor/@lit/all@3.1.2/lit-all.min.js';

export function renderSummaryCharts() {
  return html`
    <div class="charts-grid">
      <div class="chart-wrap">
        <sparkline-chart
          mock
          ?disabled=${!this.running}
          label="CPU usage"
          unit="%"
          .data=${this.stats.cpu}>
        </sparkline-chart>
      </div>
      <div class="chart-wrap">
        <sparkline-chart 
          mock
          ?disabled=${!this.running}
          label="MEM usage"
          unit="%"
          .data=${this.stats.mem}>
        </sparkline-chart>
      </div>
      <div class="chart-wrap">
        <sparkline-chart 
          mock
          ?disabled=${!this.running}
          label="DISK usage"
          unit="%"
          .data=${this.stats.disk}>
        </sparkline-chart>
      </div>
    </div>
    <style>${chartStyles}</style>
  `
}

const chartStyles = css`
  .charts-grid {
    width: 100%;
    display: grid;
    grid-gap: 10px;
    grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  }

  .charts-grid .chart-wrap {
    display: flex;
    justify-content: center;
  }
`