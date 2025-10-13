import { LitElement, html, css } from '/vendor/@lit/all@3.1.2/lit-all.min.js';
import { StoreSubscriber } from '/state/subscribe.js';
import { store } from '/state/store.js';

class ActivityIndicator extends LitElement {
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
      background: #4360ff;
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
    const { activities } = this.context.store.jobsContext;
    const activeCount = activities.filter(a => a.status === 'queued' || a.status === 'in_progress').length;
    const inProgressCount = activities.filter(a => a.status === 'in_progress').length;
    const pendingCount = activities.filter(a => a.status === 'queued').length;
    const unreadCount = activities.filter(a => !a.read && ['completed', 'failed', 'cancelled'].includes(a.status)).length;
    
    
    // Determine display text
    let displayText = 'System Activity';
    
    // Create tooltip content showing job counts
    const tooltipLines = [];
    if (inProgressCount > 0) {
      tooltipLines.push(html`${inProgressCount} Active ${inProgressCount === 1 ? 'Job' : 'Jobs'}`);
    }
    if (pendingCount > 0) {
      tooltipLines.push(html`${pendingCount} Pending ${pendingCount === 1 ? 'Job' : 'Jobs'}`);
    }
    const tooltipContent = tooltipLines.length > 0 
      ? html`${tooltipLines.map((line, i) => html`${i > 0 ? html`<br>` : ''}${line}`)}`
      : html`No active jobs`;
    
    return html`
      <sl-tooltip placement="top">
        <div slot="content">${tooltipContent}</div>
        <div class="indicator" @click=${this.handleClick}>
          <sl-icon name="gear" class="icon ${activeCount > 0 ? 'spinning' : ''}"></sl-icon>
          <span class="text">
            <span>${displayText}</span>
          </span>
          ${unreadCount > 0 ? html`
            <span class="badge has-unread">${unreadCount}</span>
          ` : (activeCount > 0 ? html`
            <span class="badge">${activeCount}</span>
          ` : '')}
        </div>
      </sl-tooltip>
    `;
  }
}

customElements.define('activity-indicator', ActivityIndicator);

