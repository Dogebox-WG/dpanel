import { LitElement, html, css } from '/vendor/@lit/all@3.1.2/lit-all.min.js';

class JobProgress extends LitElement {
  static properties = {
    job: { type: Object },
    expanded: { type: Boolean }
  };
  
  static styles = css`
    :host {
      display: block;
      margin-bottom: 0.5em;
    }
    
    .job-card {
      background: #222;
      border: 1px solid #333;
      border-radius: 6px;
      padding: 0.75em 1em;
      cursor: pointer;
      transition: background 200ms ease;
    }
    
    .job-card:hover {
      background: #2a2a2a;
    }
    
    .job-card.sensitive {
      border-left: 4px solid #ff9800;
    }
    
    .job-row {
      display: flex;
      align-items: center;
      gap: 1em;
    }
    
    .task-label {
      display: flex;
      align-items: center;
      gap: 0.5em;
      min-width: 200px;
      white-space: nowrap;
    }
    
    .task-name {
      font-size: 0.95rem;
      font-weight: 500;
      color: #fff;
    }
    
    .job-icon {
      font-size: 1rem;
      flex-shrink: 0;
    }
    
    .job-icon.in_progress {
      color: #4360ff;
      animation: pulse 2s ease-in-out infinite;
    }
    
    .job-icon.completed {
      color: #2ede75;
    }
    
    .job-icon.failed {
      color: #ff6b6b;
    }
    
    .job-icon.queued {
      color: #888;
    }
    
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
    
    .progress-bar-container {
      flex: 1;
      height: 24px;
      background: #333;
      border-radius: 4px;
      overflow: hidden;
      position: relative;
      min-width: 150px;
    }
    
    .progress-bar {
      height: 100%;
      transition: width 500ms ease;
      border-radius: 4px;
    }
    
    .job-percentage {
      font-size: 1rem;
      font-weight: 600;
      color: #fff;
      min-width: 50px;
      text-align: right;
      flex-shrink: 0;
    }
    
    .progress-bar.in_progress {
      background: linear-gradient(90deg, #4360ff, #667aff);
    }
    
    .progress-bar.completed {
      background: linear-gradient(90deg, #2ede75, #5af59d);
    }
    
    .progress-bar.failed {
      background: linear-gradient(90deg, #ff6b6b, #ff8787);
    }
    
    .progress-bar.queued {
      background: #555;
    }
    
    .error-message {
      display: flex;
      align-items: center;
      gap: 0.5em;
      margin-top: 0.75em;
      padding: 0.75em;
      background: rgba(255, 107, 107, 0.1);
      border-left: 3px solid #ff6b6b;
      border-radius: 4px;
      color: #ffaaaa;
      font-size: 0.9rem;
    }
    
    .details-container {
      margin-top: 0.75em;
      padding-top: 0.75em;
      border-top: 1px solid #333;
    }
    
    .job-summary {
      font-size: 0.85rem;
      color: #999;
      margin-bottom: 0.75em;
    }
    
    .logs-title {
      font-size: 0.85rem;
      font-weight: 600;
      margin-bottom: 0.5em;
      color: #999;
    }
    
    .logs {
      background: #1a1a1a;
      border: 1px solid #333;
      border-radius: 4px;
      padding: 0.75em;
      max-height: 200px;
      overflow-y: auto;
      font-family: 'Monaco', 'Courier New', monospace;
      font-size: 0.75rem;
      line-height: 1.4;
      color: #ccc;
    }
    
    .log-entry {
      margin-bottom: 0.25em;
      white-space: pre-wrap;
      word-break: break-all;
    }
    
    .sensitive-badge {
      display: inline-block;
      background: #ff9800;
      color: #000;
      padding: 2px 6px;
      border-radius: 3px;
      font-size: 0.65rem;
      font-weight: 600;
      text-transform: uppercase;
      margin-left: 0.5em;
    }
  `;
  
  constructor() {
    super();
    this.expanded = false;
  }
  
  toggleExpanded(e) {
    e.stopPropagation();
    this.expanded = !this.expanded;
  }
  
  getStatusIcon(status) {
    const icons = {
      in_progress: 'arrow-repeat',
      completed: 'check-circle-fill',
      failed: 'exclamation-triangle-fill',
      queued: 'clock'
    };
    return icons[status] || 'question-circle';
  }
  
  render() {
    if (!this.job) return html``;
    
    const { displayName, status, progress, summaryMessage, errorMessage, logs, sensitive } = this.job;
    
    return html`
      <div class="job-card ${sensitive ? 'sensitive' : ''}" @click=${this.toggleExpanded}>
        <div class="job-row">
          <div class="task-label">
            <sl-icon name="${this.getStatusIcon(status)}" class="job-icon ${status}"></sl-icon>
            <span class="task-name">
              ${displayName}
              ${sensitive ? html`<span class="sensitive-badge">Critical</span>` : ''}
            </span>
          </div>
          
          <div class="progress-bar-container">
            <div class="progress-bar ${status}" style="width: ${progress}%"></div>
          </div>
          
          <div class="job-percentage">${progress}%</div>
        </div>
        
        ${this.expanded ? html`
          <div class="details-container">
            <div class="job-summary">${summaryMessage}</div>
            
            ${errorMessage ? html`
              <div class="error-message">
                <sl-icon name="exclamation-triangle-fill"></sl-icon>
                <span>${errorMessage}</span>
              </div>
            ` : ''}
            
            ${logs.length > 0 ? html`
              <div class="logs-title">Logs</div>
              <div class="logs">
                ${logs.map(log => html`<div class="log-entry">${log}</div>`)}
              </div>
            ` : ''}
          </div>
        ` : ''}
      </div>
    `;
  }
}

customElements.define('job-progress', JobProgress);

