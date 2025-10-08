import { LitElement, html, css } from '/vendor/@lit/all@3.1.2/lit-all.min.js';
import { StoreSubscriber } from '/state/subscribe.js';
import { store } from '/state/store.js';
import '/components/common/job-progress/index.js';

class ActivityPage extends LitElement {
  static properties = {
    showActiveLimit: { type: Number },
    showPendingLimit: { type: Number },
    showCompletedLimit: { type: Number }
  };
  
  static styles = css`
    :host {
      display: block;
    }
    
    .padded {
      padding: 20px;
      max-width: 1200px;
      margin: 0 auto;
    }
    
    h1 {
      font-family: 'Comic Neue', sans-serif;
      font-size: 2rem;
      margin-bottom: 0.5em;
    }
    
    .section {
      margin-bottom: 2em;
    }
    
    .section-header {
      display: flex;
      align-items: center;
      gap: 1em;
      margin-bottom: 1em;
    }
    
    .section-title {
      font-size: 1.3rem;
      font-weight: 600;
      margin: 0;
    }
    
    .section-count {
      background: #333;
      color: #ccc;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 0.9rem;
    }
    
    .filter-dropdown {
      margin-left: auto;
    }
    
    .empty-state {
      padding: 0.5em 1em;
      color: #666;
      font-size: 0.9rem;
    }
    
    .show-more-btn {
      display: block;
      margin: 1em auto;
      text-align: center;
    }
    
    .pagination {
      display: flex;
      justify-content: center;
      gap: 0.5em;
      margin-top: 2em;
    }
  `;
  
  constructor() {
    super();
    this.context = new StoreSubscriber(this, store);
    this.showActiveLimit = 10;
    this.showPendingLimit = 10;
    this.showCompletedLimit = 10;
    this.hasMarkedAsRead = false;
  }
  
  connectedCallback() {
    super.connectedCallback();
    // Mark all jobs as read when viewing this page (only once)
    if (!this.hasMarkedAsRead) {
      this.markAllAsRead();
      this.hasMarkedAsRead = true;
    }
  }
  
  markAllAsRead() {
    const { jobs } = store.jobsContext;
    
    // Check if there's anything to update
    const hasUnreadJobs = jobs.some(j => !j.read && ['completed', 'failed'].includes(j.status));
    if (!hasUnreadJobs) {
      return; // Nothing to mark as read
    }
    
    const updatedJobs = jobs.map(job => {
      // Only update completed/failed jobs that are unread
      if (!job.read && ['completed', 'failed'].includes(job.status)) {
        return { ...job, read: true };
      }
      return job;
    });
    
    store.updateState({
      jobsContext: { jobs: updatedJobs }
    });
  }
  
  showMoreActive() {
    this.showActiveLimit += 10;
  }
  
  showMorePending() {
    this.showPendingLimit += 10;
  }
  
  showMoreCompleted() {
    this.showCompletedLimit += 10;
  }
  
  renderSection(title, jobs, limit, showMoreHandler) {
    const displayJobs = jobs.slice(0, limit);
    const hasMore = jobs.length > limit;
    const isEmpty = jobs.length === 0;
    
    return html`
      <div class="section">
        <div class="section-header">
          <h2 class="section-title">${title}</h2>
          ${!isEmpty ? html`<span class="section-count">${jobs.length}</span>` : ''}
        </div>
        
        ${isEmpty ? html`
          <div class="empty-state">No ${title.toLowerCase()}</div>
        ` : html`
          ${displayJobs.map(job => html`
            <job-progress .job=${job}></job-progress>
          `)}
          
          ${hasMore ? html`
            <sl-button class="show-more-btn" variant="text" @click=${showMoreHandler}>
              + ${jobs.length - limit} More
            </sl-button>
          ` : ''}
        `}
      </div>
    `;
  }
  
  render() {
    const { jobs } = this.context.store.jobsContext;
    
    const activeJobs = jobs.filter(j => j.status === 'in_progress');
    const pendingJobs = jobs.filter(j => j.status === 'queued');
    const completedJobs = jobs
      .filter(j => ['completed', 'failed'].includes(j.status))
      .sort((a, b) => new Date(b.finished) - new Date(a.finished));
    
    return html`
      <div class="padded">
        <h1>System Activity</h1>
        
        ${this.renderSection(
          'Active Jobs',
          activeJobs,
          this.showActiveLimit,
          () => this.showMoreActive()
        )}
        
        ${this.renderSection(
          'Pending Jobs',
          pendingJobs,
          this.showPendingLimit,
          () => this.showMorePending()
        )}
        
        ${this.renderSection(
          'Recently Completed Jobs',
          completedJobs,
          this.showCompletedLimit,
          () => this.showMoreCompleted()
        )}
      </div>
    `;
  }
}

customElements.define('x-page-activity', ActivityPage);

