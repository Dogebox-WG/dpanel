import { LitElement, html, css } from '/vendor/@lit/all@3.1.2/lit-all.min.js';
import { StoreSubscriber } from '/state/subscribe.js';
import { store } from '/state/store.js';
import { markAllJobsAsRead, clearCompletedJobs } from '/api/jobs/jobs.js';
import '/components/common/job-progress/index.js';

class ActivityPage extends LitElement {
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
    // Wait for jobs to load, then mark as read
    this.waitForJobsAndMarkAsRead();
  }
  
  async waitForJobsAndMarkAsRead() {
    // Poll until activities are loaded (max 3 seconds)
    for (let i = 0; i < 30; i++) {
      const { activities } = store.jobsContext;
      if (activities && activities.length > 0) {
        await this.markAllAsRead();
        return;
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  async markAllAsRead() {
    const { activities } = store.jobsContext;
    
    const unreadActivities = activities.filter(a => !a.read && ['completed', 'failed', 'cancelled'].includes(a.status));
    
    if (unreadActivities.length === 0) {
      return;
    }
    
    try {
      await markAllJobsAsRead();
      
      const updatedActivities = activities.map(activity => {
        if (!activity.read && ['completed', 'failed', 'cancelled'].includes(activity.status)) {
          return { ...activity, read: true };
        }
        return activity;
      });
      
      store.updateState({
        jobsContext: { activities: updatedActivities }
      });
    } catch (err) {
      console.error('Failed to mark activities as read:', err);
    }
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
    const { activities } = store.jobsContext;
    const completedCount = activities.filter(a => ['completed', 'failed', 'cancelled'].includes(a.status)).length;
    
    if (completedCount === 0) {
      alert('No completed activities to clear.');
      return;
    }
    
    const confirmed = confirm(`Clear ${completedCount} completed/failed activities? This action cannot be undone.`);
    if (!confirmed) return;
    
    try {
      // Clear activities older than 0 days (all completed activities)
      await clearCompletedJobs(0);
      
      // Update local state
      const remainingActivities = activities.filter(a => !['completed', 'failed', 'cancelled'].includes(a.status));
      store.updateState({
        jobsContext: { activities: remainingActivities }
      });
    } catch (err) {
      console.error('Failed to clear completed activities:', err);
      alert('Failed to clear completed activities. Please try again.');
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
  
  filterJobs(activities) {
    let filtered = activities;
    
    // Apply search filter
    if (this.searchQuery) {
      filtered = filtered.filter(activity =>
        activity.displayName.toLowerCase().includes(this.searchQuery) ||
        activity.summaryMessage.toLowerCase().includes(this.searchQuery) ||
        (activity.errorMessage && activity.errorMessage.toLowerCase().includes(this.searchQuery))
      );
    }
    
    // Apply status filter
    if (this.statusFilter !== 'all') {
      filtered = filtered.filter(activity => activity.status === this.statusFilter);
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
      
      filtered = filtered.filter(activity => {
        const activityDate = new Date(activity.started);
        return activityDate >= cutoffDate;
      });
    }
    
    return filtered;
  }
  
  renderSection(title, activities, limit, showMoreHandler) {
    const displayActivities = activities.slice(0, limit);
    const hasMore = activities.length > limit;
    const isEmpty = activities.length === 0;
    
    return html`
      <div class="section">
        <div class="section-header">
          <h2 class="section-title">${title}</h2>
          ${!isEmpty ? html`<span class="section-count">${activities.length}</span>` : ''}
        </div>
        
        ${isEmpty ? html`
          <div class="empty-state">No ${title.toLowerCase()}</div>
        ` : html`
          ${displayActivities.map(activity => html`
            <job-progress .job=${activity}></job-progress>
          `)}
          
          ${hasMore ? html`
            <sl-button class="show-more-btn" variant="text" @click=${showMoreHandler}>
              + ${activities.length - limit} More
            </sl-button>
          ` : ''}
        `}
      </div>
    `;
  }
  
  render() {
    const { activities } = this.context.store.jobsContext;
    
    // Apply filters
    const filteredActivities = this.filterJobs(activities);
    
    const activeActivities = filteredActivities.filter(a => a.status === 'in_progress');
    const pendingActivities = filteredActivities.filter(a => a.status === 'queued');
    const completedActivities = filteredActivities
      .filter(a => ['completed', 'failed', 'cancelled'].includes(a.status))
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
          activeActivities,
          this.showActiveLimit,
          () => this.showMoreActive()
        )}
        
        ${this.renderSection(
          'Pending Jobs',
          pendingActivities,
          this.showPendingLimit,
          () => this.showMorePending()
        )}
        
        ${this.renderSection(
          'Recently Completed Jobs',
          completedActivities,
          this.showCompletedLimit,
          () => this.showMoreCompleted()
        )}
      </div>
    `;
  }
}

customElements.define('x-page-activity', ActivityPage);

