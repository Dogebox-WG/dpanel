import { LitElement, html, css, nothing } from '/vendor/@lit/all@3.1.2/lit-all.min.js';

/**
 * Service status card component for displaying external service information
 * Currently supports Tailscale, designed to be extensible for future services
 */
class ServiceStatusCard extends LitElement {
  static properties = {
    service: { type: Object },
    definition: { type: Object }
  };

  constructor() {
    super();
    this.service = null;
    this.definition = null;
  }

  renderTailscaleContent() {
    const status = this.service?.status || {};

    return html`
      <div class="service-details">
        <div class="detail-row">
          <span class="detail-label">IP Address</span>
          <span class="detail-value ip-value">
            ${status.ip || 'Not available'}
            ${status.ip ? html`
              <sl-copy-button value="${status.ip}" class="copy-btn"></sl-copy-button>
            ` : nothing}
          </span>
        </div>
        ${status.hostname ? html`
          <div class="detail-row">
            <span class="detail-label">Hostname</span>
            <span class="detail-value">${status.hostname}</span>
          </div>
        ` : nothing}
      </div>
    `;
  }

  renderGenericContent() {
    const status = this.service?.status || {};
    
    return html`
      <div class="service-details">
        ${Object.entries(status).map(([key, value]) => html`
          <div class="detail-row">
            <span class="detail-label">${this.formatLabel(key)}</span>
            <span class="detail-value">${String(value)}</span>
          </div>
        `)}
      </div>
    `;
  }

  formatLabel(key) {
    return key
      .replace(/_/g, ' ')
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  }

  render() {
    if (!this.service) return nothing;

    const def = this.definition || { name: this.service.name, icon: 'hdd-network' };
    const isConnected = this.service.status?.connected;
    const statusText = isConnected ? 'Connected' : 'Disconnected';

    return html`
      <div class="card ${isConnected ? 'connected' : 'disconnected'}">
        <div class="card-header">
          <div class="service-info">
            <sl-icon name="${def.icon}" class="service-icon"></sl-icon>
            <span class="service-name">${def.name}</span>
          </div>
          <div class="status-badge ${isConnected ? 'online' : 'offline'}">
            <span class="status-dot"></span>
            <span class="status-text">${statusText}</span>
          </div>
        </div>
        
        ${this.service.id === 'tailscale' 
          ? this.renderTailscaleContent() 
          : this.renderGenericContent()
        }
      </div>
    `;
  }

  static styles = css`
    :host {
      display: block;
    }

    .card {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 8px;
      padding: 1rem;
      transition: border-color 0.2s ease;
    }

    .card:hover {
      border-color: rgba(255, 255, 255, 0.15);
    }

    .card.connected {
      border-left: 3px solid #07ffae;
    }

    .card.disconnected {
      border-left: 3px solid var(--sl-color-danger-500);
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }

    .service-info {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .service-icon {
      font-size: 1.25rem;
      color: var(--sl-color-neutral-400);
    }

    .service-name {
      font-family: 'Comic Neue', sans-serif;
      font-weight: bold;
      font-size: 1rem;
      color: var(--sl-color-neutral-100);
    }

    .status-badge {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.25rem 0.6rem;
      border-radius: 999px;
      font-size: 0.75rem;
      font-weight: 500;
    }

    .status-badge.online {
      background: rgba(7, 255, 174, 0.1);
      color: #07ffae;
    }

    .status-badge.offline {
      background: rgba(255, 85, 85, 0.1);
      color: var(--sl-color-danger-500);
    }

    .status-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: currentColor;
    }

    .service-details {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .detail-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.25rem 0;
    }

    .detail-label {
      font-size: 0.8rem;
      color: var(--sl-color-neutral-500);
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }

    .detail-value {
      font-family: monospace;
      font-size: 0.9rem;
      color: var(--sl-color-neutral-200);
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }

    .ip-value {
      color: #ffd807;
    }

    .copy-btn {
      --sl-color-primary-600: var(--sl-color-neutral-500);
      font-size: 0.85rem;
    }

    .copy-btn::part(button) {
      padding: 0.15rem;
    }
  `;
}

customElements.define('service-status-card', ServiceStatusCard);

