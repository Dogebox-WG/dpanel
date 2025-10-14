import { LitElement, html, css } from '/vendor/@lit/all@3.1.2/lit-all.min.js';
import { timeAgo } from '/utils/time-format.js';
import { store } from '/state/store.js';
import '/components/views/x-log-viewer/index.js';

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
    
    x-log-viewer {
      margin-top: 0.75em;
      --log-viewer-height: 180px;
      --log-footer-height: 48px;
      --margin-top: 0;
      --margin-bottom: 0;
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
    
    @media (max-width: 768px) {
      .job-row {
        flex-wrap: wrap;
        gap: 0.75em;
      }
      
      .task-label {
        width: 100%;
        min-width: 100%;
        order: 1;
      }
      
      .progress-bar-container {
        width: 100%;
        min-width: 100%;
        order: 2;
      }
      
      .job-percentage {
        position: absolute;
        right: 8px;
        top: 50%;
        transform: translateY(-50%);
        font-size: 0.85rem;
        width: auto;
        min-width: auto;
      }
      
      .timing-info {
        width: 100%;
        min-width: 100%;
        margin-left: 0;
        margin-top: 0.5em;
        order: 3;
        justify-content: space-between;
        gap: 0.5em;
      }
      
      .timing-item {
        flex: 1;
        text-align: center;
      }
      
      .timing-label {
        font-size: 0.65rem;
      }
      
      .timing-value {
        font-size: 0.75rem;
      }
    }
    
    @media (max-width: 480px) {
      .job-card {
        padding: 0.5em 0.75em;
      }
      
      .task-label {
        gap: 0.25em;
      }
      
      .task-name {
        font-size: 0.9rem;
      }
      
      .job-icon {
        font-size: 0.9rem;
      }
      
      .progress-bar-container {
        height: 20px;
      }
      
      .job-percentage {
        font-size: 0.75rem;
      }
      
      .timing-info {
        font-size: 0.75rem;
      }
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
      queued: 'clock',
      cancelled: 'x-circle'
    };
    return icons[status] || 'question-circle';
  }
  
  render() {
    if (!this.job) return html``;
    
    const { displayName, status, progress, summaryMessage, errorMessage, started, finished } = this.job;
    
    // Show indeterminate progress for active jobs at 0% only (not queued jobs)
    const isIndeterminate = status === 'in_progress' && progress === 0;
    
    return html`
      <div class="job-card" @click=${this.toggleExpanded}>
        <div class="job-row">
          <div class="task-label">
            <sl-icon name="${this.getStatusIcon(status)}" class="job-icon ${status}"></sl-icon>
            <span class="task-name">
              ${displayName}
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
            ${errorMessage ? html`
              <div class="error-message">
                <sl-icon name="exclamation-triangle-fill"></sl-icon>
                <span>${errorMessage}</span>
              </div>
            ` : ''}
            
            <x-log-viewer 
              .jobId=${this.job.id}
              autostart
            ></x-log-viewer>
          </div>
        ` : ''}
      </div>
    `;
  }
}

customElements.define('job-progress', JobProgress);

