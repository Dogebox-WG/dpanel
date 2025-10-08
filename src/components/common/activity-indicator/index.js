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
    
    .text {
      flex: 1;
      font-size: 0.9rem;
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
    // Count both queued and in-progress as "active"
    const activeCount = jobs.filter(j => j.status === 'queued' || j.status === 'in_progress').length;
    const inProgressCount = jobs.filter(j => j.status === 'in_progress').length;
    const unreadCount = jobs.filter(j => !j.read && ['completed', 'failed'].includes(j.status)).length;
    
    // Determine display text
    let displayText = 'Activity';
    if (activeCount > 0) {
      displayText = `(${activeCount}) Active task${activeCount !== 1 ? 's' : ''}`;
    } else if (unreadCount > 0) {
      displayText = 'Tasks completed';
    }
    
    return html`
      <div class="indicator" @click=${this.handleClick}>
        <sl-icon name="gear" class="icon ${inProgressCount > 0 ? 'spinning' : ''}"></sl-icon>
        <span class="text">${displayText}</span>
        ${unreadCount > 0 ? html`
          <span class="badge has-unread">${unreadCount}</span>
        ` : (activeCount > 0 ? html`
          <span class="badge">${activeCount}</span>
        ` : '')}
      </div>
    `;
  }
}

customElements.define('activity-indicator', ActivityIndicator);

