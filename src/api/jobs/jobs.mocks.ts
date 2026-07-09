import { isActiveJobStatus, isFinishedJobStatus } from '/controllers/jobs/status.js';
import type { JobStatus } from '/types/jobs';

/**
 * Lightweight mock for job system
 * Mimics backend WebSocket/HTTP behavior for frontend development
 * NO complex job lifecycle management - just data flow testing
 */

/** Mock jobs use numeric ids, unlike the backend's string JobRecord ids. */
export interface MockJob {
  id: number;
  started: string;
  finished: string | null;
  displayName: string;
  progress: number;
  status: JobStatus;
  summaryMessage: string;
  errorMessage: string | null;
}

type MockSocketHandler = (data?: { data: string }) => void;

let mockJobId = 1;
let mockJobs: MockJob[] = [
  {
    id: mockJobId++,
    started: new Date(Date.now() - 300000).toISOString(),
    finished: new Date(Date.now() - 60000).toISOString(),
    displayName: 'System Upgrade',
    progress: 100,
    status: 'completed',
    summaryMessage: 'Upgrade completed successfully',
    errorMessage: null
  },
  {
    id: mockJobId++,
    started: new Date(Date.now() - 120000).toISOString(),
    finished: new Date(Date.now() - 30000).toISOString(),
    displayName: 'Install Core Pup',
    progress: 45,
    status: 'failed',
    summaryMessage: 'Installation failed',
    errorMessage: 'Insufficient disk space'
  }
];

// Mock WebSocket for Jobs
export class MockJobWebSocket {
  listeners: Map<string, MockSocketHandler[]>;
  connected: boolean;

  constructor() {
    this.listeners = new Map();
    this.connected = false;
  }

  connect(url?: string): this {
    this.connected = true;

    // Simulate connection delay
    setTimeout(() => {
      this.trigger('open');
      // Send initial jobs
      this.send({
        type: 'bootstrap',
        update: { jobs: mockJobs }
      });
    }, 100);

    return this;
  }

  on(event: string, handler: MockSocketHandler) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(handler);
  }

  trigger(event: string, data?: { data: string }) {
    const handlers = this.listeners.get(event) || [];
    handlers.forEach(handler => handler(data));
  }

  send(message: unknown) {
    // Simulate receiving a message
    this.trigger('message', { data: JSON.stringify(message) });
  }

  close() {
    this.connected = false;
    this.trigger('close');
  }

  // Helper: Simulate creating a new job
  simulateJobCreated(displayName = 'Mock Job') {
    const job: MockJob = {
      id: mockJobId++,
      started: new Date().toISOString(),
      finished: null,
      displayName,
      progress: 0,
      status: 'queued',
      summaryMessage: 'Queued',
      errorMessage: null,
    };

    mockJobs.push(job);

    this.send({
      type: 'job:created',
        update: job
    });

    // Simulate progress after 2 seconds
    setTimeout(() => {
      this.simulateProgress(job.id);
    }, 2000);
  }

  // Helper: Simulate progress updates
  simulateProgress(jobId: number) {
    const job = mockJobs.find(a => a.id === jobId);
    if (!job) return;

    const isActive = isActiveJobStatus(job.status);
    if (!isActive) {
      return;
    }

    // Transition from queued to in_progress
    if (job.status === 'queued') {
      job.status = 'in_progress';
      job.summaryMessage = 'Starting...';
      this.send({
        type: 'job:updated',
        update: { ...job }
      });
    }

    // Progress update loop
    const interval = setInterval(() => {
      if (!job || job.status !== 'in_progress') {
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
          update: { ...job }
        });

        clearInterval(interval);
      } else {
        job.summaryMessage = `Processing... ${job.progress}%`;
        this.send({
          type: 'job:updated',
          update: { ...job }
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

  getJob: (id: number | string) => {
    const job = mockJobs.find(j => String(j.id) === String(id));
    return Promise.resolve({
      success: !!job,
      job: job || null
    });
  },

  deleteJob: (id: number | string) => {
    const deletedJob = mockJobs.find(j => String(j.id) === String(id));
    mockJobs = mockJobs.filter(j => String(j.id) !== String(id));
    if (mockJobWS) {
      mockJobWS.send({
        type: 'job:deleted',
        update: { id: deletedJob?.id ?? id }
      });
    }
    return Promise.resolve({ success: true, deleted: id });
  },

  createOrphanedJobCandidate: () => {
    return Promise.reject(new Error('Create orphaned job requires the real backend with Network Mocks disabled.'));
  },


  clearCompletedJobs: (olderThanDays: number) => {
    const cutoff = new Date(Date.now() - (olderThanDays * 24 * 60 * 60 * 1000));
    mockJobs = mockJobs.filter(j => {
      const isFinished = isFinishedJobStatus(j.status);
      if (!isFinished) return true;

      const jobDate = new Date(j.finished || j.started);
      return jobDate >= cutoff;
    });
    return Promise.resolve({ success: true });
  }
};

// Mock WebSocket for Log Streaming
export class MockLogWebSocket {
  jobId: number | string;
  listeners: Map<string, MockSocketHandler[]>;
  logLines: string[];
  logIndex: number;

  constructor(jobId: number | string) {
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

  connect(): this {
    setTimeout(() => {
      this.trigger('open');
      this.streamLogs();
    }, 100);
    return this;
  }

  on(event: string, handler: MockSocketHandler) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(handler);
  }

  trigger(event: string, data?: { data: string }) {
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
export let mockJobWS: MockJobWebSocket | null = null;

export function createMockJobWebSocket(): MockJobWebSocket {
  mockJobWS = new MockJobWebSocket();
  return mockJobWS;
}

// Expose to dev tools for manual testing
if (typeof window !== 'undefined') {
  window.__mockJobWS = mockJobWS;
}
