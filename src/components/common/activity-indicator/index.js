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
    const { jobs } = this.context.store.jobsContext;
    // Count both queued and in-progress as "active"
    const activeCount = jobs.filter(j => j.status === 'queued' || j.status === 'in_progress').length;
    const inProgressCount = jobs.filter(j => j.status === 'in_progress').length;
    const pendingCount = jobs.filter(j => j.status === 'queued').length;
    const unreadCount = jobs.filter(j => !j.read && ['completed', 'failed'].includes(j.status)).length;
    
    // Check if there's a critical job actively running (not just queued)
    const hasCriticalJob = jobs.some(j => 
      j.sensitive && j.status === 'in_progress'
    );
    
    // Determine display text
    let displayText = 'Activity';
    let showCriticalIcon = false;
    if (activeCount > 0) {
      displayText = `(${activeCount}) Active task${activeCount !== 1 ? 's' : ''}`;
      if (hasCriticalJob) {
        displayText = 'Critical task running';
        showCriticalIcon = true;
      }
    } else if (unreadCount > 0) {
      displayText = 'Tasks completed';
    }
    
    // Create tooltip content showing job counts (critical first, then active, then pending)
    const tooltipLines = [];
    if (hasCriticalJob) {
      tooltipLines.push(html`⚠️ Critical Task in Progress`);
    }
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
          <span class="text ${hasCriticalJob ? 'critical' : ''}">
            ${showCriticalIcon ? html`<span class="critical-icon">⚠️</span>` : ''}
            <span>${displayText}</span>
          </span>
          ${unreadCount > 0 && !hasCriticalJob ? html`
            <span class="badge has-unread">${unreadCount}</span>
          ` : (hasCriticalJob ? html`
            <span class="badge critical">!</span>
          ` : (activeCount > 0 ? html`
            <span class="badge">${activeCount}</span>
          ` : ''))}
        </div>
      </sl-tooltip>
    `;
  }
}

customElements.define('activity-indicator', ActivityIndicator);

