# System Activity Feature - Implementation Plan

## Overview
Implement a front-end system activity tracker for Dogebox that displays background jobs, their progress, and completion status. This feature helps users track critical operations like system upgrades, pup installations, and rebuilds.

## Problem Statement
Critical jobs running on Dogebox can be 'lost' through page refresh or navigation. Users need visibility into background operations and their status.

## Solution
Display system jobs and activity in a dedicated activity page with a navigation indicator showing active task count.

---

## 📝 Latest Updates

**December 2024 - Pagination Enhancement**
- ✅ Implemented smart pagination: 10 jobs per section (Active/Pending/Completed)
- ✅ "Show more" buttons load 10 additional jobs at a time
- ✅ Maximum 30 jobs visible initially across all sections
- ✅ Improves performance and reduces DOM bloat for large job histories
- ✅ Progressive disclosure pattern for better UX

**Status:** Phase 1-5 Complete | Next: Phase 6 (Job Queue Management)

---

## Architecture

### Data Model

#### Job Object Schema
```javascript
{
  id: Number,                    // Unique identifier
  started: Date,                 // ISO datetime when job started
  finished: Date | null,         // ISO datetime when job finished (null if not finished)
  displayName: String,           // Human-readable job name
  sensitive: Boolean,            // Is this a critical job that blocks other operations?
  progress: Number,              // 0-100 percentage
  status: String,                // 'queued' | 'in_progress' | 'completed' | 'failed'
  summaryMessage: String,        // One-line current task description
  errorMessage: String | null,   // Error details if status is 'failed'
  logs: Array<String>,           // Collection of log messages
  read: Boolean                  // Has user viewed this job's completion?
}
```

#### Job Status States
- `queued` - Job is waiting to start
- `in_progress` - Job is currently running
- `completed` - Job finished successfully
- `failed` - Job encountered an error

---

## Implementation Phases

### Phase 1: Core Infrastructure

#### 1.1 Store Management (`src/state/store.js`)

**Add jobsContext:**
```javascript
this.jobsContext = {
  jobs: [],           // Array of all jobs (persisted indefinitely)
  lastJobId: 0,       // Counter for generating unique IDs
  currentPage: 1,     // Current pagination page
  pageSize: 20        // Jobs per page
}
```

**Update Methods:**
- Extend `updateState()` to handle `jobsContext`
- Extend `persist()` to save jobs to localStorage
- Extend `hydrate()` to load jobs from localStorage
- Add job recovery logic in `hydrate()`:
  - On app load, find jobs with `status: 'in_progress'`
  - Update them to `status: 'failed'` with `errorMessage: 'Unexpected interruption (system reboot or page refresh)'`
  - Mark as unread

**Computed Properties:**
```javascript
getActiveJobsCount() {
  return jobs.filter(j => j.status === 'in_progress').length;
}

getUnreadJobsCount() {
  return jobs.filter(j => !j.read && ['completed', 'failed'].includes(j.status)).length;
}
```

#### 1.2 Job API Mocks (`src/api/jobs/`)

**File: `src/api/jobs/jobs.js`**
```javascript
export async function getAllJobs() {
  return client.request('/jobs', {
    method: 'get',
    mock: getAllJobsMock
  });
}

export async function createJob(jobData) {
  return client.request('/jobs', {
    method: 'post',
    body: jobData,
    mock: createJobMock
  });
}

export async function updateJob(jobId, updates) {
  return client.request(`/jobs/${jobId}`, {
    method: 'patch',
    body: updates,
    mock: updateJobMock
  });
}
```

**File: `src/api/jobs/jobs.mocks.js`**
```javascript
export const getAllJobsMock = {
  name: '/jobs',
  method: 'get',
  group: 'jobs',
  res: () => {
    // Return jobs from store
    const { jobs } = store.jobsContext;
    return { success: true, jobs };
  }
}

export const createJobMock = {
  name: '/jobs',
  method: 'post',
  group: 'jobs',
  res: (path, { body }) => {
    // Create new job and add to store
    const newJob = {
      id: ++store.jobsContext.lastJobId,
      started: new Date().toISOString(),
      finished: null,
      displayName: body.displayName,
      sensitive: body.sensitive || false,
      progress: 0,
      status: 'in_progress',
      summaryMessage: body.summaryMessage || 'Starting...',
      errorMessage: null,
      logs: [],
      read: false
    };
    
    store.updateState({
      jobsContext: {
        jobs: [...store.jobsContext.jobs, newJob]
      }
    });
    
    return { success: true, job: newJob };
  }
}

export const updateJobMock = {
  name: '/jobs/:id',
  method: 'patch',
  group: 'jobs',
  res: (path, { body }) => {
    const jobId = parseInt(path.split('/').pop());
    const jobs = store.jobsContext.jobs.map(job => {
      if (job.id === jobId) {
        return { ...job, ...body };
      }
      return job;
    });
    
    store.updateState({
      jobsContext: { jobs }
    });
    
    return { success: true };
  }
}
```

**Register mocks in `src/api/mocks.js`:**
```javascript
import { getAllJobsMock, createJobMock, updateJobMock } from './jobs/jobs.mocks.js';

export const mocks = [
  // ... existing mocks
  getAllJobsMock,
  createJobMock,
  updateJobMock,
];
```

#### 1.3 Job Simulator Utility (`src/utils/job-simulator.js`)

Handles automatic progress simulation for active jobs:

```javascript
class JobSimulator {
  constructor() {
    this.activeSimulations = new Map();
  }
  
  startSimulation(jobId, options = {}) {
    const {
      minDelay = 500,
      maxDelay = 3000,
      successRate = 0.8,  // 80% success rate
      logMessages = []
    } = options;
    
    const simulate = async () => {
      const job = store.jobsContext.jobs.find(j => j.id === jobId);
      if (!job || job.status !== 'in_progress') {
        this.stopSimulation(jobId);
        return;
      }
      
      // Random progress jump (5-25%)
      const jump = Math.floor(Math.random() * 20) + 5;
      const newProgress = Math.min(job.progress + jump, 100);
      
      // Random log message
      const logMessage = logMessages.length > 0
        ? logMessages[Math.floor(Math.random() * logMessages.length)]
        : `Progress update: ${newProgress}%`;
      
      const updates = {
        progress: newProgress,
        logs: [...job.logs, `[${new Date().toISOString()}] ${logMessage}`]
      };
      
      // If reached 100%, complete or fail
      if (newProgress >= 100) {
        const success = Math.random() < successRate;
        updates.status = success ? 'completed' : 'failed';
        updates.finished = new Date().toISOString();
        updates.progress = success ? 100 : job.progress;
        
        if (!success) {
          updates.errorMessage = 'Job failed: ' + getRandomError();
        }
        
        this.stopSimulation(jobId);
      }
      
      await updateJob(jobId, updates);
      
      // Schedule next update
      if (newProgress < 100) {
        const delay = Math.random() * (maxDelay - minDelay) + minDelay;
        this.activeSimulations.set(jobId, setTimeout(simulate, delay));
      }
    };
    
    simulate();
  }
  
  stopSimulation(jobId) {
    if (this.activeSimulations.has(jobId)) {
      clearTimeout(this.activeSimulations.get(jobId));
      this.activeSimulations.delete(jobId);
    }
  }
  
  stopAllSimulations() {
    this.activeSimulations.forEach((timeout, jobId) => {
      clearTimeout(timeout);
    });
    this.activeSimulations.clear();
  }
}

export const jobSimulator = new JobSimulator();

function getRandomError() {
  const errors = [
    'Network timeout',
    'Insufficient disk space',
    'Service unavailable',
    'Configuration error',
    'Permission denied'
  ];
  return errors[Math.floor(Math.random() * errors.length)];
}
```

---

### Phase 2: UI Components

#### 2.1 Activity Indicator (`src/components/common/activity-indicator/`)

**File: `src/components/common/activity-indicator/index.js`**

Small component displayed in nav footer showing active jobs count.

```javascript
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
    const activeCount = jobs.filter(j => j.status === 'in_progress').length;
    const unreadCount = jobs.filter(j => !j.read && ['completed', 'failed'].includes(j.status)).length;
    
    if (activeCount === 0 && unreadCount === 0) {
      return html``;
    }
    
    return html`
      <div class="indicator" @click=${this.handleClick}>
        <sl-icon name="gear" class="icon ${activeCount > 0 ? 'spinning' : ''}"></sl-icon>
        <span class="text">
          ${activeCount > 0 ? `${activeCount} Active task${activeCount !== 1 ? 's' : ''}` : 'Tasks completed'}
        </span>
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
```

#### 2.2 Job Progress Component (`src/components/common/job-progress/`)

**File: `src/components/common/job-progress/index.js`**

Reusable component for displaying individual job with progress bar and logs.

```javascript
import { LitElement, html, css } from '/vendor/@lit/all@3.1.2/lit-all.min.js';

class JobProgress extends LitElement {
  static properties = {
    job: { type: Object },
    expanded: { type: Boolean }
  };
  
  static styles = css`
    :host {
      display: block;
      margin-bottom: 1em;
    }
    
    .job-card {
      background: #222;
      border: 1px solid #333;
      border-radius: 8px;
      padding: 1em;
      cursor: pointer;
      transition: background 200ms ease;
    }
    
    .job-card:hover {
      background: #2a2a2a;
    }
    
    .job-card.sensitive {
      border-left: 4px solid #ff9800;
    }
    
    .job-header {
      display: flex;
      align-items: center;
      gap: 1em;
      margin-bottom: 0.75em;
    }
    
    .job-icon {
      font-size: 1.5rem;
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
    
    .job-info {
      flex: 1;
    }
    
    .job-title {
      font-size: 1rem;
      font-weight: 600;
      margin: 0 0 0.25em 0;
      color: #fff;
    }
    
    .job-summary {
      font-size: 0.85rem;
      color: #999;
      margin: 0;
    }
    
    .job-percentage {
      font-size: 1.2rem;
      font-weight: 600;
      color: #fff;
      min-width: 60px;
      text-align: right;
    }
    
    .progress-bar-container {
      width: 100%;
      height: 24px;
      background: #333;
      border-radius: 4px;
      overflow: hidden;
      position: relative;
    }
    
    .progress-bar {
      height: 100%;
      transition: width 500ms ease;
      border-radius: 4px;
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
    
    .logs-container {
      margin-top: 1em;
      padding-top: 1em;
      border-top: 1px solid #333;
    }
    
    .logs-title {
      font-size: 0.9rem;
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
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 0.7rem;
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
        <div class="job-header">
          <sl-icon name="${this.getStatusIcon(status)}" class="job-icon ${status}"></sl-icon>
          <div class="job-info">
            <h4 class="job-title">
              ${displayName}
              ${sensitive ? html`<span class="sensitive-badge">Critical</span>` : ''}
            </h4>
            <p class="job-summary">${summaryMessage}</p>
          </div>
          <div class="job-percentage">${progress}%</div>
        </div>
        
        <div class="progress-bar-container">
          <div class="progress-bar ${status}" style="width: ${progress}%"></div>
        </div>
        
        ${errorMessage ? html`
          <div class="error-message">
            <sl-icon name="exclamation-triangle-fill"></sl-icon>
            <span>${errorMessage}</span>
          </div>
        ` : ''}
        
        ${this.expanded && logs.length > 0 ? html`
          <div class="logs-container">
            <div class="logs-title">Logs</div>
            <div class="logs">
              ${logs.map(log => html`<div class="log-entry">${log}</div>`)}
            </div>
          </div>
        ` : ''}
      </div>
    `;
  }
}

customElements.define('job-progress', JobProgress);
```

#### 2.3 Activity Page (`src/pages/page-activity/`)

**File: `src/pages/page-activity/index.js`**

Main activity page showing all jobs organized by status.

```javascript
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
    /* Compact, clean styling for activity page */
    :host { display: block; }
    
    .padded {
      padding: 20px;
      max-width: 1200px;
      margin: 0 auto;
    }
    
    /* Section headers with count badges */
    .section-header {
      display: flex;
      align-items: center;
      gap: 1em;
      margin-bottom: 1em;
    }
    
    .section-count {
      background: #333;
      color: #ccc;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 0.9rem;
    }
    
    /* "Show more" pagination buttons */
    .show-more-btn {
      display: block;
      margin: 1em auto;
      text-align: center;
    }
    
    /* Empty state when no jobs */
    .empty-state {
      text-align: center;
      padding: 3em 1em;
      color: #666;
    }
  `;
  
  constructor() {
    super();
    this.context = new StoreSubscriber(this, store);
    // Each section starts with 10 jobs visible
    this.showActiveLimit = 10;
    this.showPendingLimit = 10;
    this.showCompletedLimit = 10;
    this.hasMarkedAsRead = false;
  }
  
  connectedCallback() {
    super.connectedCallback();
    // Mark completed/failed jobs as read on first view
    if (!this.hasMarkedAsRead) {
      this.markAllAsRead();
      this.hasMarkedAsRead = true;
    }
  }
  
  markAllAsRead() {
    const { jobs } = store.jobsContext;
    const hasUnreadJobs = jobs.some(j => !j.read && ['completed', 'failed'].includes(j.status));
    if (!hasUnreadJobs) return;
    
    const updatedJobs = jobs.map(job => {
      if (!job.read && ['completed', 'failed'].includes(job.status)) {
        return { ...job, read: true };
      }
      return job;
    });
    
    store.updateState({
      jobsContext: { jobs: updatedJobs }
    });
  }
  
  // Pagination handlers - increment by 10 each time
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
    // Only show first N jobs, with "show more" button if there are more
    const displayJobs = jobs.slice(0, limit);
    const hasMore = jobs.length > limit;
    
    return html`
      <div class="section">
        <div class="section-header">
          <h2 class="section-title">${title}</h2>
          <span class="section-count">${jobs.length}</span>
        </div>
        
        ${jobs.length === 0 ? html`
          <div class="empty-state">
            <sl-icon name="inbox"></sl-icon>
            <p>No ${title.toLowerCase()} found</p>
          </div>
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
    
    // Separate jobs by status
    const activeJobs = jobs.filter(j => j.status === 'in_progress');
    const pendingJobs = jobs.filter(j => j.status === 'queued');
    const completedJobs = jobs
      .filter(j => ['completed', 'failed'].includes(j.status))
      .sort((a, b) => new Date(b.finished) - new Date(a.finished));
    
    return html`
      <div class="padded">
        <h1>System Activity</h1>
        
        <!-- Active Jobs: Max 10 visible initially -->
        ${this.renderSection(
          `Active Jobs (${activeJobs.length})`,
          activeJobs,
          this.showActiveLimit,
          () => this.showMoreActive()
        )}
        
        <!-- Pending Jobs: Max 10 visible initially -->
        ${this.renderSection(
          `Pending Jobs (${pendingJobs.length})`,
          pendingJobs,
          this.showPendingLimit,
          () => this.showMorePending()
        )}
        
        <!-- Recently Completed: Max 10 visible initially -->
        ${this.renderSection(
          `Recently Completed`,
          completedJobs,
          this.showCompletedLimit,
          () => this.showMoreCompleted()
        )}
      </div>
    `;
  }
}

customElements.define('x-page-activity', ActivityPage);
```

---

### Phase 3: Integration

#### 3.1 Router Configuration

**File: `src/router/config.js`**

Add activity route:

```javascript
{
  path: '/activity',
  component: 'x-page-activity',
  pageTitle: 'System Activity',
  before: [isAuthed, asPage],
},
```

#### 3.2 Navigation Integration

**File: `src/components/layouts/standard/renders/nav.js`**

Add activity indicator to nav footer:

```javascript
import '/components/common/activity-indicator/index.js';

// In the renderNav function, uncomment and update the nav-footer section:
<div class="nav-footer">
  <activity-indicator></activity-indicator>
</div>
```

**File: `src/components/layouts/standard/styles/nav.styles.js`**

Update nav-footer styles:

```javascript
.nav-footer {
  position: absolute;
  bottom: 0px;
  left: 0px;
  width: var(--sidebar-width);
  z-index: 1;
}
```

#### 3.3 Page Registration

**File: `src/pages/index.js`**

Add import:

```javascript
import "./page-activity/index.js";
```

---

### Phase 4: Job Creation Hooks

#### 4.1 Dev Tools Integration

**File: `src/utils/devtools/debug-panel.js`**

Add "Create Mock Job" to dev tools menu:

```javascript
// Add method
createMockJob() {
  const jobTypes = [
    { displayName: 'NixOS Rebuild', summaryMessage: 'Rebuilding system configuration', sensitive: true },
    { displayName: 'Applying SSH', summaryMessage: 'Configuring SSH access', sensitive: false },
    { displayName: 'Pup Install', summaryMessage: 'Installing pup package', sensitive: false },
    { displayName: 'System Update', summaryMessage: 'Updating system packages', sensitive: true },
    { displayName: 'Import Blockchain', summaryMessage: 'Importing blockchain data', sensitive: false }
  ];
  
  const randomJob = jobTypes[Math.floor(Math.random() * jobTypes.length)];
  
  // Import and use jobs API
  import('/api/jobs/jobs.js').then(({ createJob }) => {
    createJob(randomJob).then(({ job }) => {
      // Start simulation
      import('/utils/job-simulator.js').then(({ jobSimulator }) => {
        jobSimulator.startSimulation(job.id, {
          logMessages: [
            'Fetching dependencies...',
            'Compiling packages...',
            'Running configuration...',
            'Verifying installation...',
            'Cleaning up...'
          ]
        });
      });
    });
  });
}

// Update render method - add to the Commands submenu:
<sl-menu-label>Jobs</sl-menu-label>
<sl-menu-item @click=${this.createMockJob}>Create Mock Job</sl-menu-item>
<sl-divider></sl-divider>
```

#### 4.2 Pup Action Hooks

**File: `src/api/action/action.js`** (or wherever pup actions are triggered)

When install/uninstall/rebuild actions are called, create corresponding jobs:

```javascript
// Example for install action
export async function installPup(pupId) {
  const job = await createJob({
    displayName: `Installing ${pupId}`,
    summaryMessage: 'Preparing installation...',
    sensitive: false
  });
  
  jobSimulator.startSimulation(job.id, {
    logMessages: [
      'Downloading pup manifest...',
      'Resolving dependencies...',
      'Building pup...',
      'Configuring services...',
      'Installation complete!'
    ]
  });
  
  // Continue with actual API call
  return client.request(`/todo/${pupId}/install`, {
    method: 'post',
    mock: installMock
  });
}
```

---

### Phase 5: Auto-Start Simulations

#### 5.1 Job Monitor Service

**File: `src/controllers/jobs/job-monitor.js`**

Service that automatically starts simulations for in-progress jobs on app load:

```javascript
import { store } from '/state/store.js';
import { jobSimulator } from '/utils/job-simulator.js';

class JobMonitor {
  constructor() {
    this.started = false;
  }
  
  start() {
    if (this.started) return;
    this.started = true;
    
    // Find all in-progress jobs and start simulations
    const { jobs } = store.jobsContext;
    const activeJobs = jobs.filter(j => j.status === 'in_progress');
    
    activeJobs.forEach(job => {
      jobSimulator.startSimulation(job.id);
    });
    
    // Subscribe to store changes to auto-start new jobs
    store.subscribe({
      stateChanged: () => {
        const { jobs } = store.jobsContext;
        const activeJobs = jobs.filter(j => j.status === 'in_progress');
        
        activeJobs.forEach(job => {
          if (!jobSimulator.activeSimulations.has(job.id)) {
            jobSimulator.startSimulation(job.id);
          }
        });
      }
    });
  }
  
  stop() {
    jobSimulator.stopAllSimulations();
    this.started = false;
  }
}

export const jobMonitor = new JobMonitor();
```

#### 5.2 App Integration

**File: `src/app.js`**

Start job monitor when app initializes:

```javascript
import { jobMonitor } from '/controllers/jobs/job-monitor.js';

// In connectedCallback or wherever app initializes:
connectedCallback() {
  super.connectedCallback();
  // ... existing code
  
  // Start job monitoring
  jobMonitor.start();
}
```

---

## ✅ IMPLEMENTATION STATUS

### Phase 1: Core Infrastructure - **COMPLETE**
- ✅ Store management with `jobsContext` 
- ✅ Job persistence in localStorage
- ✅ Job API client methods (`getAllJobs`, `createJob`, `updateJob`)
- ✅ Job API mocks with store integration
- ✅ Job simulator with random progress updates (3-15% jumps, 1-4s delays)
- ✅ Queued → In Progress → Completed/Failed lifecycle
- ✅ Jobs survive page refresh and continue automatically

### Phase 2: UI Components - **COMPLETE**
- ✅ Activity indicator in nav footer (always visible)
- ✅ Compact job progress cards (single-row layout)
- ✅ Click-to-expand for logs and details
- ✅ Activity page with three sections (Active/Pending/Completed)
- ✅ Color-coded status icons and progress bars
- ✅ Pagination with "show more" buttons (10 per section, 30 max visible)
- ✅ Sensitive job indicators (orange border + badge)

### Phase 3: Integration - **COMPLETE**
- ✅ `/activity` route added to router
- ✅ Activity page registered
- ✅ Activity indicator integrated in nav footer
- ✅ Job monitor auto-starts simulations on app load

### Phase 4: Job Creation & Testing - **COMPLETE**
- ✅ "Create Mock Job" button in dev tools (Ctrl+L)
- ✅ Six job types with random selection
- ✅ Configurable log messages per job
- ✅ Read/unread state management
- ✅ Auto-mark as read when viewing activity page

### Key Features Implemented
- 📊 **Real-time progress updates** - Jobs progress automatically with random jumps
- 💾 **Full persistence** - All jobs saved to localStorage indefinitely
- 🔄 **Auto-resume** - Jobs continue after page refresh/navigation
- 🎯 **Compact UI** - Single-row job cards with expand-for-details
- 🏷️ **Status tracking** - Queued, In Progress, Completed, Failed
- 🔴 **Unread badges** - Red badges for new completions/failures
- ⚙️ **Spinning gear** - Indicates active processing
- 🚨 **Sensitive jobs** - Visual indicators for critical operations
- 📄 **Smart pagination** - Max 10 jobs per section, "show more" to expand

### Current Behavior
- Jobs start as **queued** (2 second initial delay)
- Transition to **in_progress** after delay
- Progress in random jumps of **3-15%** every **1-4 seconds**
- 80% success rate (configurable)
- Complete in approximately **20-40 seconds**
- Activity indicator counts both queued + in-progress as "active"
- Gear icon only spins when jobs are actually in progress

---

## 🚀 NEXT PHASES (Future Development)

### Phase 6: Job Queue Management System

**Critical Job Blocking**
- Implement job queue with priority levels
- Block all new jobs when sensitive/critical job is running
- Queue non-critical jobs until sensitive job completes
- Visual indicator showing "waiting for critical job to complete"
- User notification when attempting to start job during critical operation

**Implementation Steps:**
```javascript
// Job queue manager
class JobQueueManager {
  - Check if any critical jobs are active before allowing new jobs
  - Maintain queue of pending jobs waiting for critical job completion
  - Auto-start queued jobs when critical job finishes
  - Provide getCriticalJobStatus() for UI checks
}

// Update job creation to check for blocking
if (hasCriticalJobRunning()) {
  if (newJob.sensitive) {
    return { error: 'Cannot start critical job while another is running' };
  } else {
    queueJob(newJob);
    return { success: true, queued: true };
  }
}
```

**UI Updates:**
- Warning modal when trying to start critical job while one is running
- "Blocked by: [Job Name]" indicator on queued jobs
- System-wide banner during critical operations
- Disable shutdown/reboot buttons during sensitive operations

---

### Phase 7: Job Control Actions

**Cancel Job**
- Add cancel button to in-progress jobs
- Confirmation dialog for canceling sensitive jobs
- Stop simulation and mark job as "cancelled"
- Clean up any partial work

**Retry Failed Job**
- "Retry" button on failed jobs
- Create new job with same parameters
- Option to clear old failed job or keep for history

**Clear Completed Jobs**
- Bulk action to clear completed/failed jobs
- Keep last N jobs option
- Confirmation dialog before clearing
- Export job history before clearing

---

### Phase 8: Real Backend Integration

**WebSocket Job Updates**
```javascript
// Replace mock simulator with real WebSocket updates
socket.on('job:update', (jobData) => {
  updateJob(jobData.id, {
    progress: jobData.progress,
    status: jobData.status,
    logs: jobData.logs,
    summaryMessage: jobData.message
  });
});

// Real job creation sends to backend
async function createRealJob(jobData) {
  const response = await fetch('/api/jobs', {
    method: 'POST',
    body: JSON.stringify(jobData)
  });
  // Backend starts actual process and streams updates via WebSocket
}
```

**Backend Requirements:**
- Job persistence in database (SQLite/PostgreSQL)
- Job executor service to run actual operations
- WebSocket server for real-time updates
- Job log aggregation and streaming
- Job failure recovery and retry logic

**Interruption Detection:**
- Backend tracks job heartbeats
- On server restart, mark interrupted jobs appropriately
- Client reconnection logic to resume receiving updates
- Differentiate between client refresh and server crash

---

### Phase 9: Advanced Filtering & Search

**Filter Options:**
- By status (queued/in_progress/completed/failed)
- By date range (today/week/month/custom)
- By job type (system/pup/backup)
- By sensitive flag
- Combine multiple filters

**Search Functionality:**
- Full-text search across job names and logs
- Search within specific time periods
- Highlight search matches in logs
- Persist search/filter preferences

**Sort Options:**
- By start time (newest/oldest)
- By duration
- By status
- By job name (alphabetical)

---

### Phase 10: Job Analytics & History

**Duration Tracking:**
- Calculate and display job duration
- Average duration per job type
- Trend analysis (jobs getting slower?)
- Performance degradation alerts

**Success/Failure Metrics:**
- Success rate by job type
- Failure pattern analysis
- Most common error messages
- Time-of-day failure correlation

**History Visualization:**
- Timeline view of all jobs
- Gantt chart of concurrent jobs
- Heatmap of activity patterns
- Resource usage during jobs

**Reporting:**
- Weekly job summary
- Failed job report
- Performance benchmarks
- Export to CSV/JSON

---

### Phase 11: Advanced Notifications

**Desktop Notifications:**
```javascript
// Request permission and show notifications
if (Notification.permission === 'granted') {
  new Notification('Job Completed', {
    body: `${job.displayName} finished successfully`,
    icon: '/static/favicon.ico',
    tag: `job-${job.id}`
  });
}
```

**Toast Notifications:**
- Non-intrusive in-app toasts for job events
- Stack multiple notifications
- Click to navigate to job details
- Auto-dismiss after timeout

**Sound Alerts:**
- Optional sound for job completion
- Different sounds for success vs failure
- User-configurable per job type
- Respect system do-not-disturb settings

**Email Notifications (Backend):**
- Email on critical job failure
- Daily digest of job activity
- Alert for long-running jobs
- Configurable notification rules

---

### Phase 12: Job Dependencies & Workflows

**Job Chaining:**
```javascript
// Define job that runs after another completes
createJob({
  displayName: 'Deploy App',
  dependsOn: [buildJobId],
  triggeredBy: 'completion', // or 'success' or 'failure'
  autoStart: true
});
```

**Conditional Execution:**
- Run job B only if job A succeeds
- Run cleanup job if main job fails
- Parallel job execution for independent tasks
- DAG (Directed Acyclic Graph) visualization

**Scheduled Jobs:**
- Cron-style scheduling
- One-time scheduled execution
- Recurring jobs (daily backups, etc.)
- Job templates for quick creation

---

### Phase 13: Multi-User Support

**Job Ownership:**
- Track which user created each job
- Filter to show "my jobs" only
- Permission checks for canceling others' jobs
- Audit log of job actions

**Collaborative Features:**
- Share job results
- Comment on jobs
- Tag/categorize jobs
- Team dashboards

---

### Phase 14: Resource Management

**Resource Awareness:**
- Track CPU/memory/disk usage per job
- Prevent starting jobs if resources insufficient
- Queue jobs until resources available
- Kill jobs that exceed resource limits

**Throttling:**
- Limit concurrent jobs by type
- Rate limit job creation
- Stagger job starts to reduce load spikes
- Priority queuing for urgent jobs

---

## Testing Checklist

### Manual Testing - Phase 1-5 (Completed ✅)
- ✅ Create mock jobs via dev tools menu
- ✅ Verify jobs appear in activity page
- ✅ Confirm progress bars update automatically
- ✅ Check logs expand/collapse correctly
- ✅ Test pagination (10 jobs per section, show more buttons work)
- ✅ Verify activity indicator shows in nav
- ✅ Confirm badge shows correct counts
- ✅ Test page refresh - jobs persist and continue
- ✅ Test marking jobs as read when viewing activity page
- ✅ Confirm sensitive jobs have visual indicator
- ✅ Test multiple jobs running simultaneously
- ✅ Verify completed jobs show green, failed show red
- ✅ Test error messages display correctly
- ✅ Compact single-row layout working
- ✅ Click-to-expand details functioning

### Edge Cases - Phase 1-5 (Completed ✅)
- ✅ Activity indicator always visible (even with 0 jobs)
- ✅ Jobs continue after page navigation
- ✅ Multiple rapid job creations handled
- ✅ Job completion during page navigation works
- ✅ Empty state displays when no jobs exist
- ✅ Very long job names handled gracefully
- ✅ Logs scroll correctly

### Testing TODO for Future Phases
- [ ] **Phase 6:** Critical job blocking prevents new jobs
- [ ] **Phase 6:** Queue system works correctly
- [ ] **Phase 7:** Cancel job stops simulation
- [ ] **Phase 7:** Retry failed job creates new job
- [ ] **Phase 8:** WebSocket updates received
- [ ] **Phase 9:** Filters work correctly
- [ ] **Phase 10:** Analytics display accurate data
- [ ] **Phase 11:** Notifications fire appropriately
- [ ] **Phase 12:** Job dependencies execute in order

---

## Priority Roadmap

### Short Term (Phase 6-7)
**Goal:** Make system production-ready with essential controls
- **Phase 6: Job Queue Management** (Highest Priority)
  - Critical for system stability
  - Prevents conflicts between operations
  - Required before production use
  - Estimated: 2-3 days
  
- **Phase 7: Job Control Actions**
  - Essential user control
  - Cancel, retry, clear actions
  - Estimated: 2 days

### Medium Term (Phase 8-9)
**Goal:** Connect to real backend and improve UX
- **Phase 8: Real Backend Integration**
  - Required for production deployment
  - Move from mock to actual system operations
  - Estimated: 1-2 weeks
  
- **Phase 9: Advanced Filtering & Search**
  - Quality of life improvement
  - Essential as job history grows
  - Estimated: 3-4 days

### Long Term (Phase 10-14)
**Goal:** Enhanced features and scalability
- **Phase 10:** Analytics & reporting
- **Phase 11:** Notifications system
- **Phase 12:** Job workflows & dependencies
- **Phase 13:** Multi-user support
- **Phase 14:** Resource management

### Immediate Next Steps
1. Implement `JobQueueManager` class
2. Add critical job detection logic
3. Create queue visualization in UI
4. Add warning modals for blocked operations
5. Block shutdown/reboot during critical jobs
6. Test with multiple concurrent critical jobs

---

## File Structure Summary

```
src/
├── api/
│   └── jobs/
│       ├── jobs.js                    # Job API client methods
│       └── jobs.mocks.js              # Mock responses
├── components/
│   └── common/
│       ├── activity-indicator/
│       │   └── index.js               # Nav footer indicator
│       └── job-progress/
│           └── index.js               # Job card component
├── controllers/
│   └── jobs/
│       └── job-monitor.js             # Auto-start job simulations
├── pages/
│   └── page-activity/
│       └── index.js                   # Main activity page
├── state/
│   └── store.js                       # Updated with jobsContext
└── utils/
    └── job-simulator.js               # Progress simulation utility
```

---

## Implementation Progress

1. ✅ Document created
2. ✅ Phase 1: Core Infrastructure (Store + API)
3. ✅ Phase 2: UI Components
4. ✅ Phase 3: Integration (Router + Nav)
5. ✅ Phase 4: Job Creation (Dev tools + hooks)
6. ✅ Phase 5: Auto-simulation & Polish
7. 📋 Phase 6: Job Queue Management (Next)
8. 📋 Phase 7: Job Control Actions
9. 📋 Phase 8: Real Backend Integration
10. 📋 Phase 9: Advanced Filtering & Search
11. 📋 Phase 10: Job Analytics & History
12. 📋 Phase 11: Advanced Notifications
13. 📋 Phase 12: Job Dependencies & Workflows
14. 📋 Phase 13: Multi-User Support
15. 📋 Phase 14: Resource Management

---

## Implementation Notes (Phase 1-5)

### Current Implementation
- ✅ All jobs persist indefinitely in localStorage
- ✅ Progress updates automatically via random jumps (3-15%)
- ✅ Viewing activity page marks completed/failed jobs as read
- ✅ No filters implemented yet (Phase 9)
- ✅ Job simulator creates realistic delays (1-4s between updates)
- ✅ 80% success rate for mock jobs (configurable)
- ✅ Activity indicator always visible in nav footer
- ✅ Compact single-row job cards
- ✅ Jobs start as queued, transition to in_progress after 2s delay
- ✅ Both queued and in-progress count as "active"
- ✅ Gear icon only spins for in-progress jobs
- ✅ **Pagination: 10 jobs per section** (Active/Pending/Completed)
- ✅ **"Show more" buttons** increment by 10 jobs each click
- ✅ **Maximum 30 jobs visible** at once across all sections (unless expanded)

### Technical Decisions
- **Mock-first approach**: Full front-end simulation allows testing without backend
- **LocalStorage persistence**: Simple, works for MVP, but will need backend for production
- **Random progression**: Realistic-looking progress without actual process monitoring
- **Job monitor pattern**: Central service manages all active simulations
- **Store-based state**: All job state in Redux-style store for reactivity
- **Smart pagination**: Limits initial view to 10 jobs per section for performance
  - Prevents DOM bloat with hundreds of job cards
  - "Show more" pattern provides progressive disclosure
  - Each section paginated independently
  - No impact on underlying data persistence

### Known Limitations (To Address in Future Phases)
- No job cancellation (Phase 7)
- No critical job blocking (Phase 6)
- No filtering/search (Phase 9)
- No real backend integration (Phase 8)
- No notifications (Phase 11)
- No job dependencies (Phase 12)
- No resource awareness (Phase 14)

### Migration Path to Real Backend
1. Replace job simulator with WebSocket listeners
2. Move job persistence from localStorage to backend database
3. Implement actual job executor on backend
4. Add real-time log streaming
5. Implement interruption detection and recovery
6. Keep UI largely unchanged (just swap data source)

