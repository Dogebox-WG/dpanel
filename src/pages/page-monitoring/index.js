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

// Default dashboard structure for first-time users
const DEFAULT_DASHBOARDS = [
  {
    id: 'default',
    name: 'Overview',
    components: []
  }
];

class MonitoringPage extends LitElement {
  static properties = {
    loading: { type: Boolean },
    error: { type: Boolean },
    systemStats: { type: Object },
    availableServices: { type: Array },
    dashboards: { type: Array },
    activeDashboardId: { type: String },
    editMode: { type: Boolean },
    showAddModal: { type: Boolean },
    showPupMetricEditor: { type: Boolean },
    editingPupId: { type: String },
    installedPups: { type: Array },
    usingFallbackStats: { type: Boolean }
  };

  constructor() {
    super();
    this.loading = true;
    this.error = false;
    this.systemStats = null;
    this.availableServices = [];
    this.dashboards = this.loadDashboards();
    this.activeDashboardId = this.dashboards[0]?.id || 'default';
    this.editMode = false;
    this.showAddModal = false;
    this.showPupMetricEditor = false;
    this.editingPupId = null;
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

  loadDashboards() {
    try {
      const saved = localStorage.getItem('monitoring.dashboards');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Failed to load monitoring dashboards:', e);
    }
    return JSON.parse(JSON.stringify(DEFAULT_DASHBOARDS));
  }

  saveDashboards() {
    try {
      localStorage.setItem('monitoring.dashboards', JSON.stringify(this.dashboards));
    } catch (e) {
      console.warn('Failed to save monitoring dashboards:', e);
    }
  }

  getActiveDashboard() {
    return this.dashboards.find(d => d.id === this.activeDashboardId) || this.dashboards[0];
  }

  // Dashboard management methods
  createDashboard(name = 'New Dashboard') {
    const newDashboard = {
      id: `dashboard-${Date.now()}`,
      name,
      components: []
    };
    this.dashboards = [...this.dashboards, newDashboard];
    this.activeDashboardId = newDashboard.id;
    this.saveDashboards();
  }

  renameDashboard(dashboardId, newName) {
    this.dashboards = this.dashboards.map(d => 
      d.id === dashboardId ? { ...d, name: newName } : d
    );
    this.saveDashboards();
  }

  deleteDashboard(dashboardId) {
    if (this.dashboards.length <= 1) return; // Keep at least one dashboard
    
    this.dashboards = this.dashboards.filter(d => d.id !== dashboardId);
    
    // If we deleted the active dashboard, switch to the first one
    if (this.activeDashboardId === dashboardId) {
      this.activeDashboardId = this.dashboards[0].id;
    }
    this.saveDashboards();
  }

  reorderDashboards(fromIndex, toIndex) {
    const newDashboards = [...this.dashboards];
    const [removed] = newDashboards.splice(fromIndex, 1);
    newDashboards.splice(toIndex, 0, removed);
    this.dashboards = newDashboards;
    this.saveDashboards();
    this.requestUpdate();
  }

  reorderComponent(fromIndex, toIndex) {
    const dashboard = this.getActiveDashboard();
    if (!dashboard) return;

    const newComponents = [...dashboard.components];
    const [removed] = newComponents.splice(fromIndex, 1);
    newComponents.splice(toIndex, 0, removed);
    dashboard.components = newComponents;
    this.saveDashboards();
    this.requestUpdate();
  }

  // Component management methods
  addComponent(type, id, options = {}) {
    const dashboard = this.getActiveDashboard();
    if (!dashboard) return;

    // Check if component already exists
    const exists = dashboard.components.some(c => c.type === type && c.id === id);
    if (exists) return;

    const component = {
      type, // 'system', 'service', or 'pup'
      id,
      ...options
    };

    dashboard.components = [...dashboard.components, component];
    this.saveDashboards();
    this.requestUpdate();
  }

  removeComponent(type, id) {
    const dashboard = this.getActiveDashboard();
    if (!dashboard) return;

    dashboard.components = dashboard.components.filter(c => 
      !(c.type === type && c.id === id)
    );
    this.saveDashboards();
    this.requestUpdate();
  }

  updatePupVisibleMetrics(pupId, visibleMetrics) {
    const dashboard = this.getActiveDashboard();
    if (!dashboard) return;

    dashboard.components = dashboard.components.map(c => {
      if (c.type === 'pup' && c.id === pupId) {
        return { ...c, visibleMetrics };
      }
      return c;
    });
    this.saveDashboards();
    this.requestUpdate();
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
    }
  }

  accumulateStats(statsRes) {
    // Add new values to history buffers
    if (statsRes.cpu?.current !== undefined) {
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

  handleAddClick() {
    this.showAddModal = true;
  }

  handleAddModalClose() {
    this.showAddModal = false;
  }

  handleEditModeToggle() {
    this.editMode = !this.editMode;
  }

  handleEditPupMetrics(pupId) {
    this.editingPupId = pupId;
    this.showPupMetricEditor = true;
  }

  handlePupMetricEditorClose() {
    this.showPupMetricEditor = false;
    this.editingPupId = null;
  }

  async handleRenameDashboard(dashboardId) {
    const dashboard = this.dashboards.find(d => d.id === dashboardId);
    if (!dashboard) return;

    const newName = prompt('Enter new dashboard name:', dashboard.name);
    if (newName && newName.trim()) {
      this.renameDashboard(dashboardId, newName.trim());
    }
  }

  handleToggleSystemStat(statId) {
    const dashboard = this.getActiveDashboard();
    if (!dashboard) return;

    const exists = dashboard.components.some(c => c.type === 'system' && c.id === statId);
    if (exists) {
      this.removeComponent('system', statId);
    } else {
      this.addComponent('system', statId);
    }
  }

  handleToggleService(serviceId) {
    const dashboard = this.getActiveDashboard();
    if (!dashboard) return;

    const exists = dashboard.components.some(c => c.type === 'service' && c.id === serviceId);
    if (exists) {
      this.removeComponent('service', serviceId);
    } else {
      this.addComponent('service', serviceId);
    }
  }

  handleTogglePup(pupId) {
    const dashboard = this.getActiveDashboard();
    if (!dashboard) return;

    const exists = dashboard.components.some(c => c.type === 'pup' && c.id === pupId);
    if (exists) {
      this.removeComponent('pup', pupId);
    } else {
      const pup = this.installedPups.find(p => p.state?.id === pupId);
      if (!pup) return;

      const allMetrics = (pup.state?.manifest?.metrics || []).map(m => m.name);
      this.addComponent('pup', pupId, { visibleMetrics: allMetrics });
    }
  }

  isComponentAdded(type, id) {
    const dashboard = this.getActiveDashboard();
    if (!dashboard) return false;

    return dashboard.components.some(c => c.type === type && c.id === id);
  }

  handlePupMetricToggle(pupId, metricName, enabled) {
    const dashboard = this.getActiveDashboard();
    if (!dashboard) return;

    const component = dashboard.components.find(c => c.type === 'pup' && c.id === pupId);
    if (!component) return;

    let visibleMetrics = component.visibleMetrics || [];
    
    if (enabled) {
      if (!visibleMetrics.includes(metricName)) {
        visibleMetrics = [...visibleMetrics, metricName];
      }
    } else {
      visibleMetrics = visibleMetrics.filter(m => m !== metricName);
    }

    this.updatePupVisibleMetrics(pupId, visibleMetrics);
  }

  isPupMetricVisible(pupId, metricName) {
    const dashboard = this.getActiveDashboard();
    if (!dashboard) return false;

    const component = dashboard.components.find(c => c.type === 'pup' && c.id === pupId);
    if (!component) return false;

    return component.visibleMetrics?.includes(metricName) || false;
  }

  formatBytes(mb) {
    if (mb >= 1024) {
      return `${(mb / 1024).toFixed(1)} GB`;
    }
    return `${Math.round(mb)} MB`;
  }

  renderDashboardTabs() {
    return html`
      <div class="dashboard-tabs-container">
        <div class="dashboard-tabs">
          ${this.dashboards.map((dashboard, index) => html`
            <div 
              class="dashboard-tab ${dashboard.id === this.activeDashboardId ? 'active' : ''}"
              @click=${() => { this.activeDashboardId = dashboard.id; }}
            >
              ${this.editMode && index > 0 ? html`
                <sl-tooltip content="Move dashboard left">
                  <button 
                    class="tab-move-btn tab-move-left"
                    @click=${(e) => {
                      e.stopPropagation();
                      this.reorderDashboards(index, index - 1);
                    }}
                  >
                    <sl-icon name="chevron-left"></sl-icon>
                  </button>
                </sl-tooltip>
              ` : nothing}
              
              <span class="tab-name">${dashboard.name}</span>

              ${this.editMode && index < this.dashboards.length - 1 ? html`
                <sl-tooltip content="Move dashboard right">
                  <button 
                    class="tab-move-btn tab-move-right"
                    @click=${(e) => {
                      e.stopPropagation();
                      this.reorderDashboards(index, index + 1);
                    }}
                  >
                    <sl-icon name="chevron-right"></sl-icon>
                  </button>
                </sl-tooltip>
              ` : nothing}

              ${this.editMode ? html`
                <sl-tooltip content="Rename dashboard">
                  <sl-icon 
                    name="pencil-square" 
                    class="rename-tab"
                    @click=${(e) => {
                      e.stopPropagation();
                      this.handleRenameDashboard(dashboard.id);
                    }}
                  ></sl-icon>
                </sl-tooltip>
              ` : nothing}
              ${this.editMode && this.dashboards.length > 1 ? html`
                <sl-tooltip content="Delete dashboard">
                  <sl-icon 
                    name="x-circle" 
                    class="delete-tab"
                    @click=${(e) => {
                      e.stopPropagation();
                      this.deleteDashboard(dashboard.id);
                    }}
                  ></sl-icon>
                </sl-tooltip>
              ` : nothing}
            </div>
          `)}
          ${this.editMode ? html`
            <sl-tooltip content="Add new dashboard">
              <button 
                class="add-dashboard-btn"
                @click=${() => this.createDashboard()}
              >
                <sl-icon name="plus-lg"></sl-icon>
              </button>
            </sl-tooltip>
          ` : nothing}
        </div>
      </div>
    `;
  }

  renderEditButton() {
    return html`
      <div class="edit-button-container">
        <sl-button 
          variant=${this.editMode ? 'primary' : 'default'}
          size="small"
          @click=${this.handleEditModeToggle}
        >
          <sl-icon name="pencil" slot="prefix"></sl-icon>
          ${this.editMode ? 'Done Editing' : 'Edit'}
        </sl-button>
      </div>
    `;
  }

  renderAddButton() {
    if (!this.editMode) return nothing;

    return html`
      <button class="add-fab" @click=${this.handleAddClick}>
        <sl-icon name="plus-lg"></sl-icon>
      </button>
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

  renderSystemComponent(componentId, index) {
    if (!this.systemStats) return nothing;

    let stat = null;
    
    if (componentId === 'cpu' && this.systemStats.cpu) {
      stat = {
        id: 'cpu',
        label: 'CPU',
        icon: 'cpu',
        current: this.systemStats.cpu.current,
        values: this.systemStats.cpu.values || [],
        detail: null
      };
    } else if (componentId === 'ram' && this.systemStats.ram) {
      const ram = this.systemStats.ram;
      const usedGB = this.formatBytes(ram.used || 0);
      const totalGB = this.formatBytes(ram.total || 0);
      stat = {
        id: 'ram',
        label: 'Memory',
        icon: 'memory',
        current: ram.current,
        values: ram.values || [],
        detail: `${usedGB} / ${totalGB}`
      };
    } else if (componentId === 'disk' && this.systemStats.disk) {
      const disk = this.systemStats.disk;
      const usedGB = this.formatBytes(disk.used || 0);
      const totalGB = this.formatBytes(disk.total || 0);
      stat = {
        id: 'disk',
        label: 'Disk',
        icon: 'hdd',
        current: disk.current,
        values: disk.values || [],
        detail: `${usedGB} / ${totalGB}`
      };
    }

    if (!stat) return nothing;

    const dashboard = this.getActiveDashboard();
    const totalComponents = dashboard?.components?.length || 0;
    const position = index + 1;

    return html`
      <div class="component-wrapper" data-type="system" data-id="${componentId}">
        ${this.renderSystemStatCard(stat)}
        ${this.editMode ? html`
          <div class="card-edit-controls">
            <sl-tooltip content="Decrease card position">
              <button 
                class="card-reorder-btn"
                ?disabled=${index === 0}
                @click=${() => this.reorderComponent(index, index - 1)}
              >
                <sl-icon name="dash"></sl-icon>
              </button>
            </sl-tooltip>
            <div class="card-position-badge">${position}</div>
            <sl-tooltip content="Increase card position">
              <button 
                class="card-reorder-btn"
                ?disabled=${index === totalComponents - 1}
                @click=${() => this.reorderComponent(index, index + 1)}
              >
                <sl-icon name="plus"></sl-icon>
              </button>
            </sl-tooltip>
            <sl-tooltip content="Remove card">
              <button 
                class="delete-component-btn"
                @click=${() => this.removeComponent('system', componentId)}
              >
                <sl-icon name="x-circle-fill"></sl-icon>
              </button>
            </sl-tooltip>
          </div>
        ` : nothing}
      </div>
    `;
  }

  renderServiceComponent(serviceId, index) {
    const service = this.availableServices.find(s => s.id === serviceId && s.configured);
    if (!service) return nothing;

    const dashboard = this.getActiveDashboard();
    const totalComponents = dashboard?.components?.length || 0;
    const position = index + 1;

    return html`
      <div class="component-wrapper" data-type="service" data-id="${serviceId}">
        <service-status-card
          .service=${service}
          .definition=${SERVICE_DEFINITIONS[serviceId]}
        ></service-status-card>
        ${this.editMode ? html`
          <div class="card-edit-controls">
            <sl-tooltip content="Decrease card position">
              <button 
                class="card-reorder-btn"
                ?disabled=${index === 0}
                @click=${() => this.reorderComponent(index, index - 1)}
              >
                <sl-icon name="dash"></sl-icon>
              </button>
            </sl-tooltip>
            <div class="card-position-badge">${position}</div>
            <sl-tooltip content="Increase card position">
              <button 
                class="card-reorder-btn"
                ?disabled=${index === totalComponents - 1}
                @click=${() => this.reorderComponent(index, index + 1)}
              >
                <sl-icon name="plus"></sl-icon>
              </button>
            </sl-tooltip>
            <sl-tooltip content="Remove card">
              <button 
                class="delete-component-btn"
                @click=${() => this.removeComponent('service', serviceId)}
              >
                <sl-icon name="x-circle-fill"></sl-icon>
              </button>
            </sl-tooltip>
          </div>
        ` : nothing}
      </div>
    `;
  }

  renderPupComponent(pupId, visibleMetrics = [], index) {
    const pup = this.installedPups.find(p => p.state?.id === pupId);
    if (!pup) return nothing;

    const manifestMetrics = pup.state?.manifest?.metrics || [];
    const isRunning = pup.stats?.status === 'running';
    
    // Filter and sort metrics based on visibleMetrics array
    // Use stats metrics if available, otherwise create placeholders from manifest
    const metricsToShow = visibleMetrics
      .map(metricName => {
        // If pup is running, use actual stats
        if (isRunning && pup.stats?.metrics) {
          return pup.stats.metrics.find(m => m.name === metricName);
        }
        // Otherwise, create placeholder from manifest
        const manifestMetric = manifestMetrics.find(m => m.name === metricName);
        if (manifestMetric) {
          return {
            name: manifestMetric.name,
            label: manifestMetric.label,
            type: manifestMetric.type,
            values: []
          };
        }
        return null;
      })
      .filter(Boolean);

    if (metricsToShow.length === 0) return nothing;

    const hasMany = metricsToShow.length >= 5;
    const dashboard = this.getActiveDashboard();
    const totalComponents = dashboard?.components?.length || 0;
    const position = index + 1;

    return html`
      <div class="component-wrapper pup-component" data-type="pup" data-id="${pupId}">
        <div class="pup-header">
          <h3 class="pup-name">${pup.state?.manifest?.meta?.name || 'Unknown Pup'}</h3>
          ${this.editMode ? html`
            <div class="pup-actions">
              <sl-tooltip content="Edit pup metrics">
                <sl-button 
                  size="small"
                  @click=${() => this.handleEditPupMetrics(pupId)}
                >
                  <sl-icon name="sliders" slot="prefix"></sl-icon>
                  Edit Metrics
                </sl-button>
              </sl-tooltip>
            </div>
          ` : nothing}
        </div>
        <div class="metrics-container ${hasMany ? 'scrollable' : ''}">
          ${metricsToShow.map(metric => html`
            <x-metric .metric=${{
              name: metric.name,
              label: metric.label,
              type: metric.type,
              values: metric.values || []
            }}></x-metric>
          `)}
        </div>
        ${this.editMode ? html`
          <div class="card-edit-controls pup-edit-controls">
            <sl-tooltip content="Decrease card position">
              <button 
                class="card-reorder-btn"
                ?disabled=${index === 0}
                @click=${() => this.reorderComponent(index, index - 1)}
              >
                <sl-icon name="dash"></sl-icon>
              </button>
            </sl-tooltip>
            <div class="card-position-badge">${position}</div>
            <sl-tooltip content="Increase card position">
              <button 
                class="card-reorder-btn"
                ?disabled=${index === totalComponents - 1}
                @click=${() => this.reorderComponent(index, index + 1)}
              >
                <sl-icon name="plus"></sl-icon>
              </button>
            </sl-tooltip>
            <sl-tooltip content="Remove card">
              <button 
                class="delete-component-btn"
                @click=${() => this.removeComponent('pup', pupId)}
              >
                <sl-icon name="x-circle-fill"></sl-icon>
              </button>
            </sl-tooltip>
          </div>
        ` : nothing}
      </div>
    `;
  }

  renderDashboard() {
    const dashboard = this.getActiveDashboard();
    if (!dashboard || dashboard.components.length === 0) {
      return html`
        <div class="empty-state">
          <sl-icon name="speedometer2" class="empty-icon"></sl-icon>
          <h3>Start Building Your Dashboard</h3>
          <p>${this.editMode ? 'Click the Add button to add components to your dashboard.' : 'Click Edit to start adding components to your monitoring dashboard.'}</p>
        </div>
      `;
    }

    return html`
      <div class="dashboard-grid">
        ${dashboard.components.map((component, index) => {
          if (component.type === 'system') {
            return this.renderSystemComponent(component.id, index);
          } else if (component.type === 'service') {
            return this.renderServiceComponent(component.id, index);
          } else if (component.type === 'pup') {
            return this.renderPupComponent(component.id, component.visibleMetrics || [], index);
          }
          return nothing;
        })}
      </div>
    `;
  }

  renderAddComponentModal() {
    const configuredServices = this.availableServices.filter(s => s.configured);
    const pupsWithMetrics = this.installedPups.filter(p => p.state?.manifest?.metrics?.length > 0);

    return html`
      <sl-dialog 
        label="Add Components" 
        ?open=${this.showAddModal}
        @sl-request-close=${this.handleAddModalClose}
        class="add-modal"
      >
        <sl-tab-group>
          <sl-tab slot="nav" panel="pups">Pups</sl-tab>
          <sl-tab slot="nav" panel="system">System</sl-tab>
          <sl-tab slot="nav" panel="services">Services</sl-tab>

          <sl-tab-panel name="pups">
            <div class="add-section">
              ${pupsWithMetrics.length > 0 ? html`
                <div class="add-grid">
                  ${pupsWithMetrics.map(pup => {
                    const metrics = pup.state?.manifest?.metrics || [];
                    const isAdded = this.isComponentAdded('pup', pup.state.id);
                    return html`
                      <div 
                        class="add-card ${isAdded ? 'added' : ''}" 
                        @click=${() => this.handleTogglePup(pup.state.id)}
                      >
                        <sl-icon name="box-seam" class="add-icon"></sl-icon>
                        <div class="add-label">${pup.state?.manifest?.meta?.name || 'Unknown'}</div>
                        <div class="add-sublabel">${metrics.length} metric${metrics.length !== 1 ? 's' : ''}</div>
                      </div>
                    `;
                  })}
                </div>
              ` : html`
                <div class="empty-tab">
                  <p>No installed pups with metrics available</p>
                </div>
              `}
            </div>
          </sl-tab-panel>

          <sl-tab-panel name="system">
            <div class="add-section">
              <div class="add-grid">
                <div 
                  class="add-card ${this.isComponentAdded('system', 'cpu') ? 'added' : ''}" 
                  @click=${() => this.handleToggleSystemStat('cpu')}
                >
                  <sl-icon name="cpu" class="add-icon"></sl-icon>
                  <div class="add-label">CPU</div>
                </div>
                <div 
                  class="add-card ${this.isComponentAdded('system', 'ram') ? 'added' : ''}" 
                  @click=${() => this.handleToggleSystemStat('ram')}
                >
                  <sl-icon name="memory" class="add-icon"></sl-icon>
                  <div class="add-label">Memory</div>
                </div>
                <div 
                  class="add-card ${this.isComponentAdded('system', 'disk') ? 'added' : ''}" 
                  @click=${() => this.handleToggleSystemStat('disk')}
                >
                  <sl-icon name="hdd" class="add-icon"></sl-icon>
                  <div class="add-label">Disk</div>
                </div>
              </div>
            </div>
          </sl-tab-panel>

          <sl-tab-panel name="services">
            <div class="add-section">
              ${configuredServices.length > 0 ? html`
                <div class="add-grid">
                  ${configuredServices.map(service => {
                    const def = SERVICE_DEFINITIONS[service.id] || { name: service.name, icon: 'hdd-network' };
                    const isAdded = this.isComponentAdded('service', service.id);
                    return html`
                      <div 
                        class="add-card ${isAdded ? 'added' : ''}" 
                        @click=${() => this.handleToggleService(service.id)}
                      >
                        <sl-icon name="${def.icon}" class="add-icon"></sl-icon>
                        <div class="add-label">${def.name}</div>
                      </div>
                    `;
                  })}
                </div>
              ` : html`
                <div class="empty-tab">
                  <p>No configured services available</p>
                </div>
              `}
            </div>
          </sl-tab-panel>
        </sl-tab-group>

        <sl-button slot="footer" variant="default" @click=${this.handleAddModalClose}>
          Close
        </sl-button>
      </sl-dialog>
    `;
  }

  renderPupMetricEditor() {
    if (!this.editingPupId) return nothing;

    const pup = this.installedPups.find(p => p.state?.id === this.editingPupId);
    if (!pup) return nothing;

    const metrics = pup.state?.manifest?.metrics || [];
    if (metrics.length === 0) return nothing;

    return html`
      <sl-dialog 
        label="Edit ${pup.state?.manifest?.meta?.name || 'Pup'} Metrics" 
        ?open=${this.showPupMetricEditor}
        @sl-request-close=${this.handlePupMetricEditorClose}
        class="pup-metric-editor"
      >
        <div class="metric-editor-content">
          <p class="editor-description">Select which metrics to display for this pup:</p>
          <div class="metrics-toggle-grid">
            ${metrics.map(metric => {
              const icon = metric.type === 'string' ? 'card-text' : 'graph-up';
              const isVisible = this.isPupMetricVisible(this.editingPupId, metric.name);
              return html`
                <div 
                  class="metric-toggle-card ${isVisible ? 'enabled' : ''}"
                  @click=${() => this.handlePupMetricToggle(this.editingPupId, metric.name, !isVisible)}
                >
                  <sl-icon name="${icon}" class="card-icon"></sl-icon>
                  <div class="metric-toggle-label">${metric.label}</div>
                </div>
              `;
            })}
          </div>
        </div>

        <sl-button slot="footer" variant="primary" @click=${this.handlePupMetricEditorClose}>
          Done
        </sl-button>
      </sl-dialog>
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
        ${this.renderEditButton()}
        ${this.renderDashboardTabs()}

        <main class="dashboard-content ${this.editMode ? 'edit-mode' : ''}">
          ${this.renderDashboard()}
        </main>

        ${this.renderAddButton()}
        ${this.renderAddComponentModal()}
        ${this.renderPupMetricEditor()}
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
      max-width: 2400px;
      margin: 0 auto;
    }

    /* Edit Button */
    .edit-button-container {
      position: absolute;
      top: 1.5rem;
      right: 1.5rem;
      z-index: 100;
    }

    /* Add FAB */
    .add-fab {
      position: fixed;
      bottom: 2rem;
      right: 2rem;
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: #07ffae;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 12px rgba(7, 255, 174, 0.4);
      transition: all 0.2s ease;
      z-index: 100;
    }

    .add-fab:hover {
      transform: scale(1.1);
      box-shadow: 0 6px 16px rgba(7, 255, 174, 0.6);
    }

    .add-fab:active {
      transform: scale(1.05);
    }

    .add-fab sl-icon {
      font-size: 1.5rem;
      color: #000;
    }

    /* Dashboard Tabs */
    .dashboard-tabs-container {
      margin-bottom: 1rem;
      margin-top: 3rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }

    .dashboard-tabs {
      display: flex;
      gap: 0.5rem;
      align-items: center;
      overflow-x: auto;
      overflow-y: hidden;
      scrollbar-width: thin;
      padding-bottom: 0.5rem;
    }

    .dashboard-tabs::-webkit-scrollbar {
      height: 4px;
    }

    .dashboard-tabs::-webkit-scrollbar-track {
      background: rgba(255, 255, 255, 0.05);
    }

    .dashboard-tabs::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.2);
      border-radius: 2px;
    }

    .dashboard-tab {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-bottom: none;
      border-radius: 6px 6px 0 0;
      cursor: pointer;
      white-space: nowrap;
      transition: all 0.2s ease;
      font-family: 'Comic Neue', sans-serif;
      font-size: 0.9rem;
      color: var(--sl-color-neutral-400);
    }

    .dashboard-tab:hover {
      background: rgba(255, 255, 255, 0.05);
      border-color: rgba(255, 255, 255, 0.15);
    }

    .dashboard-tab.active {
      background: rgba(7, 255, 174, 0.1);
      border-color: rgba(7, 255, 174, 0.3);
      color: #07ffae;
    }

    .dashboard-tab .tab-name {
      font-weight: 600;
    }

    .tab-move-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      background: transparent;
      border: none;
      cursor: pointer;
      transition: all 0.15s ease;
      color: #07ffae;
      padding: 0;
      margin: 0 0.25rem;
    }

    .tab-move-btn:hover {
      opacity: 0.7;
    }

    .tab-move-btn sl-icon {
      font-size: 1rem;
    }

    .tab-move-left {
      margin-right: auto;
    }

    .tab-move-right {
      margin-left: auto;
    }

    .dashboard-tab .rename-tab {
      font-size: 0.9rem;
      color: var(--sl-color-neutral-500);
      margin-left: 0.25rem;
    }

    .dashboard-tab .rename-tab:hover {
      color: #07ffae;
    }

    .dashboard-tab .delete-tab {
      font-size: 1rem;
      color: var(--sl-color-danger-500);
      margin-left: 0.25rem;
    }

    .dashboard-tab .delete-tab:hover {
      color: var(--sl-color-danger-600);
    }

    .add-dashboard-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0.5rem 0.75rem;
      background: rgba(255, 255, 255, 0.02);
      border: 1px dashed rgba(255, 255, 255, 0.2);
      border-bottom: none;
      border-radius: 6px 6px 0 0;
      cursor: pointer;
      transition: all 0.2s ease;
      color: var(--sl-color-neutral-400);
    }

    .add-dashboard-btn:hover {
      background: rgba(255, 255, 255, 0.05);
      border-color: rgba(7, 255, 174, 0.3);
      color: #07ffae;
    }

    /* Dashboard Content */
    .dashboard-content {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .dashboard-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 280px));
      gap: 1rem;
    }

    /* Component Wrappers */
    .component-wrapper {
      position: relative;
      display: flex;
      flex-direction: column;
    }

    .component-wrapper.pup-component {
      grid-column: 1 / -1;
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: 8px;
      padding: 1rem;
      overflow: visible;
    }

    /* System Stat Cards */
    .system-stat-card {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 8px;
      padding: 1rem;
      display: flex;
      flex-direction: column;
      height: 100%;
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
      padding-top: 0.5rem;
      padding-bottom: 2px;
      height: 56px;
      width: 100%;
      box-sizing: border-box;
      overflow: visible;
    }

    .stat-chart sparkline-chart-v2 {
      display: block;
      width: 100%;
      height: 100%;
      border-bottom: none;
      --sparkline-height: 56px;
      --sparkline-width: 100%;
    }

    .stat-chart sparkline-chart-v2::part(sparkline-svg) {
      width: 100% !important;
    }

    /* Pup Component */
    .pup-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;
    }

    .pup-name {
      font-family: 'Comic Neue', sans-serif;
      text-transform: uppercase;
      color: #fff;
      margin: 0;
      font-size: 1rem;
      font-weight: bold;
      letter-spacing: 0.02em;
    }

    .pup-actions {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    /* Metrics Container */
    .metrics-container {
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .metrics-container x-metric {
      flex: 0 1 auto;
      min-width: 0;
      max-width: 200px;
      height: auto;
      --metric-padding: 0.5em;
      --metric-sparkline-height: 60px;
      --metric-label-size: 0.8rem;
      --metric-value-size: 0.8rem;
      --metric-overflow: visible;
    }

    .metrics-container.scrollable {
      flex-wrap: nowrap;
      overflow-x: scroll;
      overflow-y: visible;
      scroll-snap-type: x mandatory;
      scrollbar-width: auto;
      scrollbar-gutter: stable;
      padding-bottom: 1.5rem;
    }

    .metrics-container.scrollable x-metric {
      scroll-snap-align: start;
      flex-shrink: 0;
    }

    /* Card Edit Controls */
    .card-edit-controls {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.75rem;
      margin-top: 0.5rem;
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 6px;
    }

    .pup-edit-controls {
      margin-top: 1rem;
    }

    .card-position-badge {
      background: rgba(7, 255, 174, 0.2);
      border: 1px solid #07ffae;
      border-radius: 50%;
      width: 28px;
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: 'Comic Neue', sans-serif;
      font-size: 0.85rem;
      font-weight: bold;
      color: #07ffae;
    }

    .card-reorder-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 4px;
      width: 28px;
      height: 28px;
      cursor: pointer;
      transition: all 0.15s ease;
      color: #07ffae;
      padding: 0;
    }

    .card-reorder-btn:hover:not(:disabled) {
      background: rgba(7, 255, 174, 0.2);
      border-color: #07ffae;
    }

    .card-reorder-btn:disabled {
      opacity: 0.3;
      cursor: not-allowed;
    }

    .card-reorder-btn sl-icon {
      font-size: 1rem;
    }

    .delete-component-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      background: transparent;
      border: none;
      width: 28px;
      height: 28px;
      cursor: pointer;
      transition: all 0.15s ease;
      color: var(--sl-color-danger-500);
      padding: 0;
    }

    .delete-component-btn:hover {
      opacity: 0.7;
      transform: scale(1.1);
    }

    .delete-component-btn sl-icon {
      font-size: 1.2rem;
    }

    /* Add Component Modal */
    .add-modal::part(body) {
      padding: 0;
    }

    .add-section {
      padding: 1.5rem;
    }

    .add-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
      gap: 0.75rem;
    }

    .add-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 1.25rem 0.75rem;
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.15s ease;
      min-height: 80px;
    }

    .add-card:hover {
      background: rgba(7, 255, 174, 0.08);
      border-color: rgba(7, 255, 174, 0.3);
      transform: translateY(-2px);
    }

    .add-card.added {
      background: rgba(7, 255, 174, 0.15);
      border-color: rgba(7, 255, 174, 0.5);
    }

    .add-card.added:hover {
      background: rgba(7, 255, 174, 0.2);
      border-color: rgba(7, 255, 174, 0.6);
    }

    .add-card.added .add-icon {
      color: #07ffae;
    }

    .add-card.added .add-label {
      color: #07ffae;
    }

    .add-icon {
      font-size: 1.5rem;
      color: #07ffae;
    }

    .add-label {
      font-family: 'Comic Neue', sans-serif;
      font-size: 0.85rem;
      font-weight: 600;
      color: #fff;
      text-align: center;
    }

    .add-sublabel {
      font-size: 0.7rem;
      color: var(--sl-color-neutral-500);
      text-align: center;
    }

    .empty-tab {
      padding: 2rem;
      text-align: center;
      color: var(--sl-color-neutral-500);
    }

    /* Pup Metric Editor */
    .pup-metric-editor::part(body) {
      padding: 1.5rem;
    }

    .metric-editor-content {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .editor-description {
      color: var(--sl-color-neutral-400);
      margin: 0;
      font-size: 0.9rem;
    }

    .metrics-toggle-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(90px, 1fr));
      gap: 0.5rem;
    }

    .metric-toggle-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0.35rem;
      padding: 0.75rem 0.5rem;
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 6px;
      transition: all 0.15s ease;
      cursor: pointer;
      min-height: 65px;
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
      font-size: 1.2rem;
      color: var(--sl-color-neutral-400);
    }

    .metric-toggle-card.enabled .card-icon {
      color: #07ffae;
    }

    .metric-toggle-label {
      font-family: 'Comic Neue', sans-serif;
      font-size: 0.75rem;
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
