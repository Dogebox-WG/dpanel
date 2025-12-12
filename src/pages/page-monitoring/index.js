import { LitElement, html, css, nothing } from '/vendor/@lit/all@3.1.2/lit-all.min.js';
import { getSystemStats } from '/api/monitoring/system.js';
import { getAvailableServices } from '/api/monitoring/services.js';
import { pkgController } from '/controllers/package/index.js';
import { getBootstrapV2 } from '/api/bootstrap/bootstrap.js';
import '/components/views/x-metric/metric.js';
import '/components/views/service-status-card/index.js';
import '/components/common/action-row/action-row.js';
import '/components/common/sparkline-chart/sparkline-chart-v2.js';

// Service definitions for display purposes
const SERVICE_DEFINITIONS = {
  tailscale: { name: 'Tailscale', icon: 'hdd-network', description: 'Secure network access' }
  // Future services added here
};

// Default configuration for first-time users
const DEFAULT_CONFIG = {
  systemStats: ['cpu', 'ram'],
  services: ['tailscale'],
  pupMetrics: []
};

class MonitoringPage extends LitElement {
  static properties = {
    loading: { type: Boolean },
    error: { type: Boolean },
    systemStats: { type: Object },
    availableServices: { type: Array },
    config: { type: Object },
    showConfigDialog: { type: Boolean },
    installedPups: { type: Array },
    usingFallbackStats: { type: Boolean }
  };

  constructor() {
    super();
    this.loading = true;
    this.error = false;
    this.systemStats = null;
    this.availableServices = [];
    this.config = this.loadConfig();
    this.showConfigDialog = false;
    this.installedPups = [];
    this.pkgController = pkgController;
    this.refreshInterval = null;
    this.usingFallbackStats = false;
    // History buffers for accumulating stats over time
    this.statsHistory = {
      cpu: [],
      ram: [],
      disk: []
    };
    this.maxHistorySize = 30;
  }

  connectedCallback() {
    super.connectedCallback();
    this.pkgController.addObserver(this);
    this.fetchData();
    // Refresh stats every 5 seconds
    this.refreshInterval = setInterval(() => this.refreshStats(), 5000);
  }

  disconnectedCallback() {
    this.pkgController.removeObserver(this);
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
    super.disconnectedCallback();
  }

  loadConfig() {
    try {
      const saved = localStorage.getItem('monitoring.config');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Failed to load monitoring config:', e);
    }
    return { ...DEFAULT_CONFIG };
  }

  saveConfig() {
    try {
      localStorage.setItem('monitoring.config', JSON.stringify(this.config));
    } catch (e) {
      console.warn('Failed to save monitoring config:', e);
    }
  }

  async fetchData() {
    this.loading = true;
    this.error = false;

    try {
      // Fetch bootstrap first - this is required
      const bootstrapRes = await getBootstrapV2();
      this.pkgController.setData(bootstrapRes);
      this.installedPups = this.pkgController.pups.filter(p => p.state);

      // Fetch system stats (optional - API may not exist yet)
      try {
        const statsRes = await getSystemStats();
        this.accumulateStats(statsRes);
        this.usingFallbackStats = false;
      } catch (statsErr) {
        // Generate placeholder stats when API is unavailable
        this.systemStats = this.generateFallbackStats();
        this.usingFallbackStats = true;
      }

      // Fetch services (optional - API may not exist yet)
      try {
        console.log('[Monitoring] Fetching available services...');
        const servicesRes = await getAvailableServices();
        console.log('[Monitoring] Services response:', servicesRes);
        this.availableServices = servicesRes.available || [];
        console.log('[Monitoring] Available services:', this.availableServices);
        
        // Auto-migrate: add any newly configured services to the config
        const configuredServiceIds = this.availableServices
          .filter(s => s.configured)
          .map(s => s.id);
        const newServices = configuredServiceIds.filter(id => !this.config.services.includes(id));
        if (newServices.length > 0) {
          console.log('[Monitoring] Auto-adding new configured services:', newServices);
          this.config.services = [...this.config.services, ...newServices];
          this.saveConfig();
        }
      } catch (servicesErr) {
        console.log('[Monitoring] Failed to fetch services:', servicesErr);
        this.availableServices = [];
      }
      
    } catch (err) {
      console.error('Failed to fetch monitoring data:', err);
      this.error = true;
    } finally {
      this.loading = false;
    }
  }

  generateFallbackStats() {
    // Generate placeholder stats with small non-zero values when API is unavailable
    // (x-metric filters out zeros, so we need actual values to show a chart)
    const generatePlaceholderValues = () => Array(30).fill(null).map(() => 0.1);
    return {
      cpu: {
        label: 'CPU Usage',
        type: 'float',
        values: generatePlaceholderValues(),
        current: 0
      },
      ram: {
        label: 'Memory Usage',
        type: 'float',
        values: generatePlaceholderValues(),
        current: 0
      },
      disk: {
        label: 'Disk Usage',
        type: 'float',
        values: generatePlaceholderValues(),
        current: 0
      }
    };
  }

  async refreshStats() {
    if (this.loading) return;
    
    try {
      const statsRes = await getSystemStats();
      this.accumulateStats(statsRes);
      this.requestUpdate();
    } catch (err) {
      // Silently fail - API may not be available yet
      // Stats will show placeholder values
    }
  }

  accumulateStats(statsRes) {
    // Add new values to history buffers
    if (statsRes.cpu?.current !== undefined) {
      // If this is the first value, duplicate it so we have 2 points for the chart
      if (this.statsHistory.cpu.length === 0) {
        this.statsHistory.cpu.push(statsRes.cpu.current);
      }
      this.statsHistory.cpu.push(statsRes.cpu.current);
      if (this.statsHistory.cpu.length > this.maxHistorySize) {
        this.statsHistory.cpu.shift();
      }
    }
    if (statsRes.ram?.current !== undefined) {
      if (this.statsHistory.ram.length === 0) {
        this.statsHistory.ram.push(statsRes.ram.current);
      }
      this.statsHistory.ram.push(statsRes.ram.current);
      if (this.statsHistory.ram.length > this.maxHistorySize) {
        this.statsHistory.ram.shift();
      }
    }
    if (statsRes.disk?.current !== undefined) {
      if (this.statsHistory.disk.length === 0) {
        this.statsHistory.disk.push(statsRes.disk.current);
      }
      this.statsHistory.disk.push(statsRes.disk.current);
      if (this.statsHistory.disk.length > this.maxHistorySize) {
        this.statsHistory.disk.shift();
      }
    }

    // Build systemStats with accumulated history
    this.systemStats = {
      cpu: {
        ...statsRes.cpu,
        values: [...this.statsHistory.cpu]
      },
      ram: {
        ...statsRes.ram,
        values: [...this.statsHistory.ram]
      },
      disk: {
        ...statsRes.disk,
        values: [...this.statsHistory.disk]
      }
    };
  }

  handleConfigClick() {
    this.showConfigDialog = true;
  }

  handleDialogClose() {
    this.showConfigDialog = false;
  }

  handleSystemStatToggle(statId, e) {
    const enabled = e.target.checked;
    if (enabled) {
      if (!this.config.systemStats.includes(statId)) {
        this.config.systemStats = [...this.config.systemStats, statId];
      }
    } else {
      this.config.systemStats = this.config.systemStats.filter(s => s !== statId);
    }
    this.saveConfig();
    this.requestUpdate();
  }

  handleServiceToggle(serviceId, e) {
    const enabled = e.target.checked;
    if (enabled) {
      if (!this.config.services.includes(serviceId)) {
        this.config.services = [...this.config.services, serviceId];
      }
    } else {
      this.config.services = this.config.services.filter(s => s !== serviceId);
    }
    this.saveConfig();
    this.requestUpdate();
  }

  handlePupMetricToggle(pupId, metricName, e) {
    const enabled = e.target.checked;
    if (enabled) {
      const exists = this.config.pupMetrics.some(
        m => m.pupId === pupId && m.metricName === metricName
      );
      if (!exists) {
        this.config.pupMetrics = [...this.config.pupMetrics, { pupId, metricName }];
      }
    } else {
      this.config.pupMetrics = this.config.pupMetrics.filter(
        m => !(m.pupId === pupId && m.metricName === metricName)
      );
    }
    this.saveConfig();
    this.requestUpdate();
  }

  isPupMetricEnabled(pupId, metricName) {
    return this.config.pupMetrics.some(
      m => m.pupId === pupId && m.metricName === metricName
    );
  }

  formatBytes(mb) {
    if (mb >= 1024) {
      return `${(mb / 1024).toFixed(1)} GB`;
    }
    return `${Math.round(mb)} MB`;
  }

  renderSystemStats() {
    if (!this.systemStats) return nothing;

    const enabledStats = this.config.systemStats;
    if (enabledStats.length === 0) return nothing;

    const statsToRender = [];
    
    if (enabledStats.includes('cpu') && this.systemStats.cpu) {
      statsToRender.push({
        id: 'cpu',
        label: 'CPU',
        icon: 'cpu',
        current: this.systemStats.cpu.current,
        values: this.systemStats.cpu.values || [],
        detail: null
      });
    }
    
    if (enabledStats.includes('ram') && this.systemStats.ram) {
      const ram = this.systemStats.ram;
      const usedGB = this.formatBytes(ram.used || 0);
      const totalGB = this.formatBytes(ram.total || 0);
      statsToRender.push({
        id: 'ram',
        label: 'Memory',
        icon: 'memory',
        current: ram.current,
        values: ram.values || [],
        detail: `${usedGB} / ${totalGB}`
      });
    }
    
    if (enabledStats.includes('disk') && this.systemStats.disk) {
      const disk = this.systemStats.disk;
      const usedGB = this.formatBytes(disk.used || 0);
      const totalGB = this.formatBytes(disk.total || 0);
      statsToRender.push({
        id: 'disk',
        label: 'Disk',
        icon: 'hdd',
        current: disk.current,
        values: disk.values || [],
        detail: `${usedGB} / ${totalGB}`
      });
    }

    if (statsToRender.length === 0) return nothing;

    return html`
      <section class="dashboard-section">
        <div class="section-header">
          <h3>System</h3>
          ${this.usingFallbackStats ? html`
            <span class="api-notice">Backend not connected</span>
          ` : nothing}
        </div>
        <div class="system-stats-grid">
          ${statsToRender.map(stat => this.renderSystemStatCard(stat))}
        </div>
      </section>
    `;
  }

  renderSystemStatCard(stat) {
    const percentage = stat.current?.toFixed(1) || '0';
    const values = stat.values.filter(v => v > 0);
    const hasChart = values.length >= 2;

    return html`
      <div class="system-stat-card">
        <div class="stat-header">
          <sl-icon name="${stat.icon}" class="stat-icon"></sl-icon>
          <span class="stat-label">${stat.label}</span>
        </div>
        <div class="stat-value">${percentage}<span class="stat-unit">%</span></div>
        <div class="stat-detail">${stat.detail || html`&nbsp;`}</div>
        ${hasChart ? html`
          <div class="stat-chart">
            <sparkline-chart-v2 .data="${values}"></sparkline-chart-v2>
          </div>
        ` : nothing}
      </div>
    `;
  }

  renderServices() {
    const enabledServiceIds = this.config.services;
    console.log('[Monitoring] Config services:', enabledServiceIds);
    console.log('[Monitoring] Available services to filter:', this.availableServices);
    const servicesToShow = this.availableServices.filter(
      s => s.configured && enabledServiceIds.includes(s.id)
    );
    console.log('[Monitoring] Services to show:', servicesToShow);

    if (servicesToShow.length === 0) return nothing;

    return html`
      <section class="dashboard-section">
        <div class="section-header">
          <h3>Services</h3>
        </div>
        <div class="services-grid">
          ${servicesToShow.map(service => html`
            <service-status-card
              .service=${service}
              .definition=${SERVICE_DEFINITIONS[service.id]}
            ></service-status-card>
          `)}
        </div>
      </section>
    `;
  }

  renderPupMetrics() {
    if (this.config.pupMetrics.length === 0) return nothing;

    // Group metrics by pup
    const pupMetricsMap = new Map();
    
    for (const { pupId, metricName } of this.config.pupMetrics) {
      const pup = this.installedPups.find(p => p.state?.id === pupId);
      if (!pup || !pup.stats?.metrics) continue;
      
      const metric = pup.stats.metrics.find(m => m.name === metricName);
      if (!metric) continue;

      if (!pupMetricsMap.has(pupId)) {
        pupMetricsMap.set(pupId, {
          pup,
          metrics: [],
          manifestMetrics: pup.state?.manifest?.metrics || []
        });
      }
      pupMetricsMap.get(pupId).metrics.push(metric);
    }

    // Sort metrics within each pup by their manifest order
    for (const data of pupMetricsMap.values()) {
      data.metrics.sort((a, b) => {
        const indexA = data.manifestMetrics.findIndex(m => m.name === a.name);
        const indexB = data.manifestMetrics.findIndex(m => m.name === b.name);
        return indexA - indexB;
      });
    }

    if (pupMetricsMap.size === 0) return nothing;

    return html`
      <section class="dashboard-section">
        <div class="section-header">
          <h3>Pup Metrics</h3>
        </div>
        ${Array.from(pupMetricsMap.entries()).map(([pupId, data]) => html`
          <div class="pup-metrics-group">
            <h3 class="pup-name">${data.pup.state?.manifest?.meta?.name || 'Unknown Pup'}</h3>
            <div class="metrics-grid">
              ${data.metrics.map(metric => html`
                <x-metric .metric=${{
                  name: metric.name,
                  label: metric.label,
                  type: metric.type,
                  values: metric.values || []
                }}></x-metric>
              `)}
            </div>
          </div>
        `)}
      </section>
    `;
  }

  renderConfigDialog() {
    const configuredServices = this.availableServices.filter(s => s.configured);
    const runningPups = this.installedPups.filter(p => p.stats?.status === 'running');
    
    console.log('[Monitoring Config] All installed pups:', this.installedPups.map(p => p.state?.manifest?.meta?.name));
    console.log('[Monitoring Config] Running pups:', runningPups.map(p => p.state?.manifest?.meta?.name));
    console.log('[Monitoring Config] Running pups with metrics:', runningPups.filter(p => p.state?.manifest?.metrics?.length > 0).map(p => p.state?.manifest?.meta?.name));

    return html`
      <sl-dialog 
        label="Configure Dashboard" 
        ?open=${this.showConfigDialog}
        @sl-request-close=${this.handleDialogClose}
        class="config-dialog"
      >
        <div class="config-sections">
          <!-- System Stats Section -->
          <div class="config-section">
            <h4>System Stats</h4>
            <div class="metrics-toggle-grid">
              <div class="metric-toggle-card ${this.config.systemStats.includes('cpu') ? 'enabled' : ''}"
                   @click=${() => this.handleSystemStatToggle('cpu', { target: { checked: !this.config.systemStats.includes('cpu') } })}>
                <sl-icon name="cpu" class="card-icon"></sl-icon>
                <div class="metric-toggle-label">CPU</div>
              </div>
              <div class="metric-toggle-card ${this.config.systemStats.includes('ram') ? 'enabled' : ''}"
                   @click=${() => this.handleSystemStatToggle('ram', { target: { checked: !this.config.systemStats.includes('ram') } })}>
                <sl-icon name="memory" class="card-icon"></sl-icon>
                <div class="metric-toggle-label">Memory</div>
              </div>
              <div class="metric-toggle-card ${this.config.systemStats.includes('disk') ? 'enabled' : ''}"
                   @click=${() => this.handleSystemStatToggle('disk', { target: { checked: !this.config.systemStats.includes('disk') } })}>
                <sl-icon name="hdd" class="card-icon"></sl-icon>
                <div class="metric-toggle-label">Disk</div>
              </div>
            </div>
          </div>

          <!-- Services Section -->
          ${configuredServices.length > 0 ? html`
            <div class="config-section">
              <h4>Services</h4>
              <div class="metrics-toggle-grid">
                ${configuredServices.map(service => {
                  const def = SERVICE_DEFINITIONS[service.id] || { name: service.name, icon: 'hdd-network' };
                  return html`
                    <div class="metric-toggle-card ${this.config.services.includes(service.id) ? 'enabled' : ''}"
                         @click=${() => this.handleServiceToggle(service.id, { target: { checked: !this.config.services.includes(service.id) } })}>
                      <sl-icon name="${def.icon}" class="card-icon"></sl-icon>
                      <div class="metric-toggle-label">${def.name}</div>
                    </div>
                  `;
                })}
              </div>
            </div>
          ` : nothing}

          <!-- Pup Metrics Section -->
          ${runningPups.length > 0 ? html`
            <div class="config-section">
              <h4>Pup Metrics</h4>
              ${runningPups.map(pup => {
                const metrics = pup.state?.manifest?.metrics || [];
                if (metrics.length === 0) return nothing;
                
                return html`
                  <div class="pup-config-group">
                    <h3>${pup.state?.manifest?.meta?.name || 'Unknown'}</h3>
                    <div class="metrics-toggle-grid">
                      ${metrics.map(metric => {
                        const icon = metric.type === 'string' ? 'card-text' : 'graph-up';
                        return html`
                          <div class="metric-toggle-card ${this.isPupMetricEnabled(pup.state.id, metric.name) ? 'enabled' : ''}"
                               @click=${() => this.handlePupMetricToggle(pup.state.id, metric.name, { target: { checked: !this.isPupMetricEnabled(pup.state.id, metric.name) } })}>
                            <sl-icon name="${icon}" class="card-icon"></sl-icon>
                            <div class="metric-toggle-label">${metric.label}</div>
                          </div>
                        `;
                      })}
                    </div>
                  </div>
                `;
              })}
            </div>
          ` : nothing}
        </div>

        <sl-button slot="footer" variant="primary" @click=${this.handleDialogClose}>
          Done
        </sl-button>
      </sl-dialog>
    `;
  }

  renderEmptyState() {
    const hasAnythingEnabled = 
      this.config.systemStats.length > 0 || 
      this.config.services.length > 0 || 
      this.config.pupMetrics.length > 0;

    if (hasAnythingEnabled) return nothing;

    return html`
      <div class="empty-state">
        <sl-icon name="speedometer2" class="empty-icon"></sl-icon>
        <h3>Configure Your Dashboard</h3>
        <p>Click the settings button to add system stats, services, and pup metrics to your monitoring dashboard.</p>
        <sl-button variant="primary" @click=${this.handleConfigClick}>
          <sl-icon slot="prefix" name="gear"></sl-icon>
          Configure
        </sl-button>
      </div>
    `;
  }

  render() {
    if (this.loading) {
      return html`
        <div class="page-wrapper">
          <div class="loading-state">
            <sl-spinner style="--indicator-color: #07ffae; font-size: 2rem;"></sl-spinner>
            <p>Loading monitoring data...</p>
          </div>
        </div>
      `;
    }

    if (this.error) {
      return html`
        <div class="page-wrapper">
          <div class="error-state">
            <sl-icon name="exclamation-triangle" class="error-icon"></sl-icon>
            <h3>Failed to Load</h3>
            <p>Could not fetch monitoring data. Please try again.</p>
            <sl-button variant="primary" @click=${() => this.fetchData()}>
              Retry
            </sl-button>
          </div>
        </div>
      `;
    }

    return html`
      <div class="page-wrapper">
        <header class="page-header">
          <sl-button variant="text" @click=${this.handleConfigClick}>
            <sl-icon name="gear" slot="prefix"></sl-icon>
            Configure
          </sl-button>
        </header>

        <main class="dashboard">
          ${this.renderEmptyState()}
          ${this.renderSystemStats()}
          ${this.renderServices()}
          ${this.renderPupMetrics()}
        </main>

        ${this.renderConfigDialog()}
      </div>
    `;
  }

  static styles = css`
    :host {
      display: block;
      min-height: 100%;
    }

    .page-wrapper {
      padding: 1.5rem;
      max-width: 1400px;
      margin: 0 auto;
    }

    .page-header {
      display: flex;
      justify-content: flex-end;
      align-items: center;
      margin-bottom: 1rem;
    }

    .dashboard {
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }

    .dashboard-section {
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: 8px;
      padding: 1.25rem;
    }

    .section-header {
      margin-bottom: 1rem;
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .section-header h3 {
      font-family: 'Comic Neue', sans-serif;
      color: #07ffae;
      margin: 0;
      font-size: 1rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .api-notice {
      font-size: 0.75rem;
      color: var(--sl-color-warning-500);
      background: rgba(255, 193, 7, 0.1);
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
    }

    .metrics-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .system-stats-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1rem;
    }

    @media (max-width: 900px) {
      .system-stats-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (max-width: 600px) {
      .system-stats-grid {
        grid-template-columns: 1fr;
      }
    }

    .system-stat-card {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 8px;
      padding: 1rem;
      display: flex;
      flex-direction: column;
    }

    .stat-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .stat-icon {
      font-size: 1.1rem;
      color: #07ffae;
    }

    .stat-label {
      font-family: 'Comic Neue', sans-serif;
      font-size: 0.9rem;
      font-weight: bold;
      color: #07ffae;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .stat-value {
      font-family: 'Comic Neue', sans-serif;
      font-size: 2rem;
      font-weight: bold;
      color: #ffd807;
      line-height: 1;
      margin-top: 0.5rem;
    }

    .stat-unit {
      font-size: 1rem;
      color: var(--sl-color-neutral-500);
      margin-left: 2px;
    }

    .stat-detail {
      font-size: 0.75rem;
      color: var(--sl-color-neutral-500);
      margin-top: 0.25rem;
      font-family: monospace;
      min-height: 1.2em;
    }

    .stat-chart {
      margin-top: auto;
      padding-top: 0.75rem;
      height: 40px;
      width: 100%;
      box-sizing: border-box;
      overflow: hidden;
    }

    .stat-chart sparkline-chart-v2 {
      display: block;
      width: 100%;
      height: 100%;
      border-bottom: none;
      --sparkline-width: 100%;
    }

    .stat-chart sparkline-chart-v2::part(sparkline-svg) {
      width: 100% !important;
    }

    .services-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 1rem;
    }

    .pup-metrics-group {
      margin-bottom: 1.5rem;
    }

    .pup-metrics-group:last-child {
      margin-bottom: 0;
    }

    .pup-name {
      font-family: 'Comic Neue', sans-serif;
      text-transform: uppercase;
      color: #fff;
      margin: 0 0 0.75rem 0;
      font-size: 1rem;
      font-weight: bold;
      letter-spacing: 0.02em;
    }

    /* Config Dialog */
    .config-dialog::part(body) {
      padding: 0;
    }

    .config-sections {
      display: flex;
      flex-direction: column;
    }

    .config-section {
      padding: 1rem 1.5rem;
      border-bottom: 1px solid var(--sl-color-neutral-200);
    }

    .config-section:last-child {
      border-bottom: none;
    }

    .config-section h4 {
      font-family: 'Comic Neue', sans-serif;
      color: #07ffae;
      margin: 0 0 1rem 0;
      font-size: 0.9rem;
      text-transform: uppercase;
    }

    .config-list {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .pup-config-group {
      margin-bottom: 1rem;
    }

    .pup-config-group:last-child {
      margin-bottom: 0;
    }

    .pup-config-group h3 {
      font-family: 'Comic Neue', sans-serif;
      text-transform: uppercase;
      color: #fff;
      margin: 0 0 0.5rem 0;
      font-size: 1rem;
      font-weight: bold;
      letter-spacing: 0.02em;
    }

    .metrics-toggle-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(90px, 1fr));
      gap: 0.4rem;
    }

    .metric-toggle-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0.35rem;
      padding: 0.5rem 0.4rem;
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 4px;
      transition: all 0.15s ease;
      cursor: pointer;
      min-height: 55px;
      user-select: none;
    }

    .metric-toggle-card:hover {
      background: rgba(255, 255, 255, 0.06);
      border-color: rgba(255, 255, 255, 0.25);
      transform: translateY(-1px);
    }

    .metric-toggle-card:active {
      transform: translateY(0);
    }

    .metric-toggle-card.enabled {
      background: rgba(7, 255, 174, 0.12);
      border-color: rgba(7, 255, 174, 0.4);
    }

    .metric-toggle-card.enabled:hover {
      background: rgba(7, 255, 174, 0.16);
      border-color: rgba(7, 255, 174, 0.5);
    }

    .card-icon {
      font-size: 1.1rem;
      color: var(--sl-color-neutral-400);
    }

    .metric-toggle-card.enabled .card-icon {
      color: #07ffae;
    }

    .metric-toggle-label {
      font-family: 'Comic Neue', sans-serif;
      font-size: 0.7rem;
      font-weight: 600;
      color: var(--sl-color-neutral-400);
      text-align: center;
      line-height: 1.1;
      word-break: break-word;
    }

    .metric-toggle-card.enabled .metric-toggle-label {
      color: #07ffae;
    }

    /* Empty State */
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 4rem 2rem;
      text-align: center;
      background: rgba(255, 255, 255, 0.02);
      border: 1px dashed rgba(255, 255, 255, 0.1);
      border-radius: 8px;
    }

    .empty-icon {
      font-size: 3rem;
      color: var(--sl-color-neutral-500);
      margin-bottom: 1rem;
    }

    .empty-state h3 {
      font-family: 'Comic Neue', sans-serif;
      color: var(--sl-color-neutral-300);
      margin: 0 0 0.5rem 0;
    }

    .empty-state p {
      color: var(--sl-color-neutral-500);
      margin: 0 0 1.5rem 0;
      max-width: 400px;
    }

    /* Loading/Error States */
    .loading-state,
    .error-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 4rem 2rem;
      text-align: center;
    }

    .loading-state p {
      color: var(--sl-color-neutral-500);
      margin-top: 1rem;
    }

    .error-icon {
      font-size: 3rem;
      color: var(--sl-color-danger-500);
      margin-bottom: 1rem;
    }

    .error-state h3 {
      font-family: 'Comic Neue', sans-serif;
      color: var(--sl-color-neutral-300);
      margin: 0 0 0.5rem 0;
    }

    .error-state p {
      color: var(--sl-color-neutral-500);
      margin: 0 0 1.5rem 0;
    }
  `;
}

customElements.define('x-page-monitoring', MonitoringPage);

