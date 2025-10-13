import { store } from '/state/store.js';

/**
 * Lightweight mock for job system
 * Mimics backend WebSocket/HTTP behavior for frontend development
 * NO complex job lifecycle management - just data flow testing
 */

let mockJobId = 1;
let mockJobs = [
  {
    id: mockJobId++,
    started: new Date(Date.now() - 300000).toISOString(),
    finished: new Date(Date.now() - 60000).toISOString(),
    displayName: 'System Upgrade',
    progress: 100,
    status: 'completed',
    summaryMessage: 'Upgrade completed successfully',
    errorMessage: null,
    read: false
  },
  {
    id: mockJobId++,
    started: new Date(Date.now() - 120000).toISOString(),
    finished: new Date(Date.now() - 30000).toISOString(),
    displayName: 'Install Core Pup',
    progress: 45,
    status: 'failed',
    summaryMessage: 'Installation failed',
    errorMessage: 'Insufficient disk space',
    read: false
  }
];

// Mock WebSocket for Jobs
class MockJobWebSocket {
  constructor() {
    this.listeners = new Map();
    this.connected = false;
  }

  connect(url) {
    this.connected = true;
    
    // Simulate connection delay
    setTimeout(() => {
      this.trigger('open');
      // Send initial jobs
      this.send({
        type: 'initial',
        data: mockJobs
      });
    }, 100);

    return this;
  }

  on(event, handler) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(handler);
  }

  trigger(event, data) {
    const handlers = this.listeners.get(event) || [];
    handlers.forEach(handler => handler(data));
  }

  send(message) {
    // Simulate receiving a message
    this.trigger('message', { data: JSON.stringify(message) });
  }

  close() {
    this.connected = false;
    this.trigger('close');
  }

  // Helper: Simulate creating a new job
  simulateJobCreated(displayName = 'Mock Job') {
    const job = {
      id: mockJobId++,
      started: new Date().toISOString(),
      finished: null,
      displayName,
      progress: 0,
      status: 'queued',
      summaryMessage: 'Queued',
      errorMessage: null,
      read: false,
    };
    
    mockJobs.push(job);
    
    this.send({
      type: 'job:created',
      data: job
    });

    // Simulate progress after 2 seconds
    setTimeout(() => {
      this.simulateProgress(job.id);
    }, 2000);
  }

  // Helper: Simulate progress updates
  simulateProgress(jobId) {
    const job = mockJobs.find(a => a.id === jobId);
    if (!activity) return;
    
    if (job.status !== 'in_progress' && job.status !== 'queued') {
      return;
    }

    // Transition from queued to in_progress
    if (job.status === 'queued') {
      job.status = 'in_progress';
      job.summaryMessage = 'Starting...';
      this.send({
        type: 'job:updated',
        data: { ...job }
      });
    }

    // Progress update loop
    const interval = setInterval(() => {
      if (!activity || job.status !== 'in_progress') {
        clearInterval(interval);
        return;
      }

      job.progress += Math.floor(Math.random() * 15) + 5;
      
      if (job.progress >= 100) {
        job.progress = 100;
        job.status = Math.random() > 0.2 ? 'completed' : 'failed';
        job.finished = new Date().toISOString();
        job.summaryMessage = job.status === 'completed' 
          ? 'Completed successfully' 
          : 'Failed';
        
        if (job.status === 'failed') {
          job.errorMessage = 'Mock error: Process terminated unexpectedly';
        }
        
        this.send({
          type: `job:${job.status}`,
          data: { ...job }
        });
        
        clearInterval(interval);
      } else {
        job.summaryMessage = `Processing... ${job.progress}%`;
        this.send({
          type: 'job:updated',
          data: { ...job }
        });
      }
    }, 1500);
  }
}

// Mock HTTP API
export const mockJobApi = {
  getAllJobs: () => {
    return Promise.resolve({
      success: true,
      jobs: mockJobs
    });
  },

  getJob: (id) => {
    const job = mockJobs.find(j => j.id === id);
    return Promise.resolve({
      success: !!job,
      job: job || null
    });
  },

  markJobAsRead: (id) => {
    const job = mockJobs.find(j => j.id === id);
    if (job) {
      job.read = true;
    }
    return Promise.resolve({ success: true });
  },

  markAllJobsAsRead: () => {
    mockJobs.forEach(j => {
      if (['completed', 'failed'].includes(j.status)) {
        j.read = true;
      }
    });
    return Promise.resolve({ success: true });
  },

  clearCompletedJobs: (olderThanDays) => {
    const cutoff = new Date(Date.now() - (olderThanDays * 24 * 60 * 60 * 1000));
    mockJobs = mockJobs.filter(j => {
      const isCompleted = ['completed', 'failed'].includes(j.status);
      if (!isCompleted) return true;
      
      const jobDate = new Date(j.finished || j.started);
      return jobDate >= cutoff;
    });
    return Promise.resolve({ success: true });
  }
};

// Mock WebSocket for Log Streaming
export class MockLogWebSocket {
  constructor(jobId) {
    this.jobId = jobId;
    this.listeners = new Map();
    this.logLines = [
      `[${this.timestamp()}] Starting job ${jobId}`,
      `[${this.timestamp()}] Fetching dependencies...`,
      `[${this.timestamp()}] Building packages...`,
      `[${this.timestamp()}] Configuring system...`,
      `[${this.timestamp()}] Running tests...`,
      `[${this.timestamp()}] Finalizing...`,
    ];
    this.logIndex = 0;
  }

  timestamp() {
    return new Date().toISOString().split('T')[1].split('.')[0];
  }

  connect() {
    setTimeout(() => {
      this.trigger('open');
      this.streamLogs();
    }, 100);
    return this;
  }

  on(event, handler) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(handler);
  }

  trigger(event, data) {
    const handlers = this.listeners.get(event) || [];
    handlers.forEach(handler => handler(data));
  }

  streamLogs() {
    const interval = setInterval(() => {
      if (this.logIndex < this.logLines.length) {
        this.trigger('message', {
          data: JSON.stringify({
            message: this.logLines[this.logIndex++]
          })
        });
      } else {
        clearInterval(interval);
      }
    }, 800);
  }

  close() {
    this.trigger('close');
  }
}

// Global mock WebSocket instance
export let mockJobWS = null;

export function createMockJobWebSocket() {
  mockJobWS = new MockJobWebSocket();
  return mockJobWS;
}

// Expose to dev tools for manual testing
if (typeof window !== 'undefined') {
  window.__mockJobWS = mockJobWS;
}
