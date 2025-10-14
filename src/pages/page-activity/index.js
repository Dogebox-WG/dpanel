import { LitElement, html, css } from '/vendor/@lit/all@3.1.2/lit-all.min.js';
import { StoreSubscriber } from '/state/subscribe.js';
import { store } from '/state/store.js';
import { clearCompletedJobs } from '/api/jobs/jobs.js';
import '/components/common/job-progress/index.js';

class JobActivityPage extends LitElement {
  static properties = {
    showActiveLimit: { type: Number },
    showPendingLimit: { type: Number },
    showCompletedLimit: { type: Number },
    searchQuery: { type: String },
    statusFilter: { type: String },
    dateFilter: { type: String }
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
    
    .page-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1.5em;
    }
    
    h1 {
      font-family: 'Comic Neue', sans-serif;
      font-size: 2rem;
      margin: 0;
    }
    
    .header-actions {
      display: flex;
      gap: 0.5em;
    }
    
    .filters {
      display: flex;
      gap: 1em;
      margin-bottom: 2em;
      flex-wrap: wrap;
      align-items: center;
    }
    
    .filter-item {
      display: flex;
      align-items: center;
      gap: 0.5em;
    }
    
    .filter-label {
      font-size: 0.9rem;
      color: #999;
      font-weight: 600;
    }
    
    .search-box {
      flex: 1;
      min-width: 250px;
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
    this.searchQuery = '';
    this.statusFilter = 'all';
    this.dateFilter = 'all';
  }
  
  connectedCallback() {
    super.connectedCallback();
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
  
  async handleClearCompleted() {
    const { jobs } = store.jobsContext;
    const completedCount = jobs.filter(j => ['completed', 'failed', 'cancelled'].includes(j.status)).length;
    
    if (completedCount === 0) {
      alert('No completed jobs to clear.');
      return;
    }
    
    const confirmed = confirm(`Clear ${completedCount} completed/failed jobs? This action cannot be undone.`);
    if (!confirmed) return;
    
    try {
      // Clear jobs older than 0 days (all completed jobs)
      await clearCompletedJobs(0);
      
      // Update local state
      const remainingJobs = jobs.filter(j => !['completed', 'failed', 'cancelled'].includes(j.status));
      store.updateState({
        jobsContext: { jobs: remainingJobs }
      });
    } catch (err) {
      console.error('Failed to clear completed jobs:', err);
      alert('Failed to clear completed jobs. Please try again.');
    }
  }
  
  handleSearchInput(e) {
    this.searchQuery = e.target.value.toLowerCase();
  }
  
  handleStatusFilter(e) {
    this.statusFilter = e.target.value;
  }
  
  handleDateFilter(e) {
    this.dateFilter = e.target.value;
  }
  
  filterJobs(jobs) {
    let filtered = jobs;
    
    // Apply search filter
    if (this.searchQuery) {
      filtered = filtered.filter(job =>
        job.displayName.toLowerCase().includes(this.searchQuery) ||
        job.summaryMessage.toLowerCase().includes(this.searchQuery) ||
        (job.errorMessage && job.errorMessage.toLowerCase().includes(this.searchQuery))
      );
    }
    
    // Apply status filter
    if (this.statusFilter !== 'all') {
      filtered = filtered.filter(job => job.status === this.statusFilter);
    }
    
    // Apply date filter
    if (this.dateFilter !== 'all') {
      const now = new Date();
      const cutoffDate = new Date();
      
      switch (this.dateFilter) {
        case 'today':
          cutoffDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          cutoffDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          cutoffDate.setMonth(now.getMonth() - 1);
          break;
      }
      
      filtered = filtered.filter(job => {
        const jobDate = new Date(job.started);
        return jobDate >= cutoffDate;
      });
    }
    
    return filtered;
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
    
    // Apply filters
    const filteredJobs = this.filterJobs(jobs);
    
    const activeJobs = filteredJobs.filter(j => j.status === 'in_progress');
    const pendingJobs = filteredJobs.filter(j => j.status === 'queued');
    const completedJobs = filteredJobs
      .filter(j => ['completed', 'failed', 'cancelled'].includes(j.status))
      .sort((a, b) => new Date(b.finished || b.started) - new Date(a.finished || a.started));
    
    return html`
      <div class="padded">
        
        <div class="filters">
          <div class="filter-item search-box">
            <sl-input 
              placeholder="Search jobs..." 
              size="small"
              @input=${this.handleSearchInput}
              clearable
            >
              <sl-icon name="search" slot="prefix"></sl-icon>
            </sl-input>
          </div>
          
          <div class="filter-item">
            <span class="filter-label">Status:</span>
            <sl-select 
              size="small" 
              value="${this.statusFilter}" 
              @sl-change=${this.handleStatusFilter}
              style="min-width: 150px;"
            >
              <sl-option value="all">All</sl-option>
              <sl-option value="in_progress">In Progress</sl-option>
              <sl-option value="queued">Queued</sl-option>
              <sl-option value="completed">Completed</sl-option>
              <sl-option value="failed">Failed</sl-option>
              <sl-option value="cancelled">Cancelled</sl-option>
            </sl-select>
          </div>
          
          <div class="filter-item">
            <span class="filter-label">Date:</span>
            <sl-select 
              size="small" 
              value="${this.dateFilter}" 
              @sl-change=${this.handleDateFilter}
              style="min-width: 120px;"
            >
              <sl-option value="all">All Time</sl-option>
              <sl-option value="today">Today</sl-option>
              <sl-option value="week">Past Week</sl-option>
              <sl-option value="month">Past Month</sl-option>
            </sl-select>
          </div>
        </div>
        
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

customElements.define('x-page-activity', JobActivityPage);

