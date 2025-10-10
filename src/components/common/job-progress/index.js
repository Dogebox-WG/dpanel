import { LitElement, html, css } from '/vendor/@lit/all@3.1.2/lit-all.min.js';
import { timeAgo } from '/utils/time-format.js';
import { cancelJob } from '/api/jobs/jobs.js';
import { store } from '/state/store.js';

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
      width: 250px;
      min-width: 250px;
      flex-shrink: 0;
    }
    
    .task-name {
      font-size: 0.95rem;
      font-weight: 500;
      color: #fff;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      flex: 1;
      min-width: 0;
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
    
    .progress-bar.indeterminate {
      width: 30% !important;
      animation: indeterminate-slide 1.5s ease-in-out infinite;
    }
    
    @keyframes indeterminate-slide {
      0% {
        transform: translateX(-100%);
      }
      50% {
        transform: translateX(350%);
      }
      100% {
        transform: translateX(-100%);
      }
    }
    
    .job-percentage {
      font-size: 1rem;
      font-weight: 600;
      color: #fff;
      width: 55px;
      min-width: 55px;
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
    
    .timing-info {
      display: flex;
      gap: 1.5em;
      margin-left: 2em;
      font-size: 0.8rem;
      color: #888;
      flex-shrink: 0;
      width: 250px;
      min-width: 250px;
    }
    
    .timing-item {
      display: flex;
      flex-direction: column;
      gap: 0.15em;
      flex: 1;
      min-width: 0;
    }
    
    .timing-label {
      font-size: 0.7rem;
      text-transform: uppercase;
      color: #666;
      font-weight: 600;
    }
    
    .timing-value {
      color: #aaa;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    
    .job-actions {
      display: flex;
      gap: 0.5em;
      margin-top: 0.75em;
      padding-top: 0.75em;
      border-top: 1px solid #333;
    }
    
    .action-btn {
      padding: 0.5em 1em;
      font-size: 0.85rem;
      cursor: pointer;
      border-radius: 4px;
      border: 1px solid #444;
      background: #2a2a2a;
      color: #ccc;
      transition: all 200ms ease;
    }
    
    .action-btn:hover {
      background: #333;
      border-color: #555;
      color: #fff;
    }
    
    .action-btn.danger:hover {
      background: #ff6b6b;
      border-color: #ff6b6b;
      color: #fff;
    }
    
    .action-btn.primary:hover {
      background: #4360ff;
      border-color: #4360ff;
      color: #fff;
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
  
  async handleCancel(e) {
    e.stopPropagation();
    
    try {
      await cancelJob(this.job.id);
      
      // Update local state
      const jobs = store.jobsContext.jobs.map(job =>
        job.id === this.job.id ? { ...job, status: 'cancelled', summaryMessage: 'Job cancelled by user' } : job
      );
      store.updateState({ jobsContext: { jobs } });
    } catch (err) {
      console.error('Failed to cancel job:', err);
      alert('Failed to cancel job. Please try again.');
    }
  }
  
  handleRetry(e) {
    e.stopPropagation();
    
    // TODO: Implement retry logic
    // For now, show a message
    alert('Retry functionality coming soon!');
  }
  
  getStatusIcon(status) {
    const icons = {
      in_progress: 'arrow-repeat',
      completed: 'check-circle-fill',
      failed: 'exclamation-triangle-fill',
      queued: 'clock',
      cancelled: 'x-circle'
    };
    return icons[status] || 'question-circle';
  }
  
  render() {
    if (!this.job) return html``;
    
    const { displayName, status, progress, summaryMessage, errorMessage, logs, sensitive, started, finished } = this.job;
    
    // Show indeterminate progress for active jobs at 0% only (not queued jobs)
    const isIndeterminate = status === 'in_progress' && progress === 0;
    
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
            <div class="progress-bar ${status} ${isIndeterminate ? 'indeterminate' : ''}" 
                 style="${isIndeterminate ? '' : `width: ${progress}%`}"></div>
          </div>
          
          <div class="job-percentage">${isIndeterminate ? '...' : `${progress}%`}</div>
          
          <div class="timing-info">
            ${started ? html`
              <div class="timing-item">
                <div class="timing-label">Started</div>
                <div class="timing-value">${timeAgo(started)}</div>
              </div>
            ` : ''}
            ${finished ? html`
              <div class="timing-item">
                <div class="timing-label">Finished</div>
                <div class="timing-value">${timeAgo(finished)}</div>
              </div>
            ` : ''}
          </div>
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
            
            ${this.renderActions()}
          </div>
        ` : ''}
      </div>
    `;
  }
  
  renderActions() {
    const { status } = this.job;
    
    return html`
      <div class="job-actions">
        ${status === 'in_progress' || status === 'queued' ? html`
          <button class="action-btn danger" @click=${this.handleCancel}>
            <sl-icon name="x-circle" style="margin-right: 0.3em;"></sl-icon>
            Cancel
          </button>
        ` : ''}
        
        ${status === 'failed' ? html`
          <button class="action-btn primary" @click=${this.handleRetry}>
            <sl-icon name="arrow-clockwise" style="margin-right: 0.3em;"></sl-icon>
            Retry
          </button>
        ` : ''}
      </div>
    `;
  }
}

customElements.define('job-progress', JobProgress);

