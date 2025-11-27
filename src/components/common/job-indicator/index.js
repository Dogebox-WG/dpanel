import { LitElement, html, css } from '/vendor/@lit/all@3.1.2/lit-all.min.js';
import { StoreSubscriber } from '/state/subscribe.js';
import { store } from '/state/store.js';

class JobIndicator extends LitElement {
  static styles = css`
    :host {
      display: block;
      cursor: pointer;
      user-select: none;
    }
    
    .indicator {
      display: flex;
      align-items: center;
      gap: 0.5em;
      padding: 0.75em 1em;
      background: rgba(255, 255, 255, 0.05);
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      color: rgba(255, 255, 255, 0.7);
      transition: background 200ms ease;
    }
    
    .indicator:hover {
      background: rgba(255, 255, 255, 0.1);
      color: rgba(255, 255, 255, 0.9);
    }
    
    .indicator.active {
      background: #4360ff;
      color: white;
    }
    
    .indicator.active:hover {
      background: #4360ff;
      color: white;
    }
    
    .icon {
      font-size: 1.2rem;
    }
    
    .icon.spinning {
      animation: spin 2s linear infinite;
    }
    
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    
    .badge {
      background: #2d4599;
      color: white;
      border-radius: 12px;
      padding: 2px 8px;
      font-size: 0.75rem;
      font-weight: 600;
      min-width: 20px;
      text-align: center;
    }
    
    .badge.has-unread {
      background: #ff6b6b;
    }
    
    .badge.critical {
      background: #ff9800;
      animation: pulse-badge 2s ease-in-out infinite;
    }
    
    @keyframes pulse-badge {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.7; }
    }
    
    .text {
      flex: 1;
      font-size: 0.9rem;
      display: flex;
      align-items: center;
      gap: 0.4em;
    }
    
    .text.critical {
      color: #ff9800;
      font-weight: 600;
    }
    
    .critical-icon {
      flex-shrink: 0;
    }
  `;
  
  constructor() {
    super();
    this.context = new StoreSubscriber(this, store);
  }
  
  handleClick() {
    window.location.href = '/activity';
  }
  
  render() {
    const { jobs } = this.context.store.jobsContext;
    const inProgressCount = jobs.filter(j => j.status === 'in_progress').length;
    const isActive = window.location.pathname.startsWith('/activity');
    
    return html`
      <sl-tooltip placement="top">
        <div slot="content">${inProgressCount > 0 ? `${inProgressCount} Active ${inProgressCount === 1 ? 'Job' : 'Jobs'}` : 'No active jobs'}</div>
        <div class="indicator ${isActive ? 'active' : ''}" @click=${this.handleClick}>
          <sl-icon name="gear" class="icon ${inProgressCount > 0 ? 'spinning' : ''}"></sl-icon>
          <span class="text">
            <span>System Activity</span>
          </span>
          ${inProgressCount > 0 ? html`
            <span class="badge">${inProgressCount}</span>
          ` : ''}
        </div>
      </sl-tooltip>
    `;
  }
}

customElements.define('job-indicator', JobIndicator);

