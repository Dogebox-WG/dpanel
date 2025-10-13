import { store } from '/state/store.js';

/**
 * Lightweight mock for activity system
 * Mimics backend WebSocket/HTTP behavior for frontend development
 * NO complex job lifecycle management - just data flow testing
 */

let mockActivityId = 1;
let mockActivities = [
  {
    id: mockActivityId++,
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
    id: mockActivityId++,
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

// Mock WebSocket for Activities
class MockActivityWebSocket {
  constructor() {
    this.listeners = new Map();
    this.connected = false;
  }

  connect(url) {
    this.connected = true;
    
    // Simulate connection delay
    setTimeout(() => {
      this.trigger('open');
      // Send initial activities
      this.send({
        type: 'initial',
        data: mockActivities
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

  // Helper: Simulate creating a new activity
  simulateActivityCreated(displayName = 'Mock Activity') {
    const activity = {
      id: mockActivityId++,
      started: new Date().toISOString(),
      finished: null,
      displayName,
      progress: 0,
      status: 'queued',
      summaryMessage: 'Queued',
      errorMessage: null,
      read: false,
    };
    
    mockActivities.push(activity);
    
    this.send({
      type: 'activity:created',
      data: activity
    });

    // Simulate progress after 2 seconds
    setTimeout(() => {
      this.simulateProgress(activity.id);
    }, 2000);
  }

  // Helper: Simulate progress updates
  simulateProgress(activityId) {
    const activity = mockActivities.find(a => a.id === activityId);
    if (!activity) return;
    
    if (activity.status !== 'in_progress' && activity.status !== 'queued') {
      return;
    }

    // Transition from queued to in_progress
    if (activity.status === 'queued') {
      activity.status = 'in_progress';
      activity.summaryMessage = 'Starting...';
      this.send({
        type: 'activity:updated',
        data: { ...activity }
      });
    }

    // Progress update loop
    const interval = setInterval(() => {
      if (!activity || activity.status !== 'in_progress') {
        clearInterval(interval);
        return;
      }

      activity.progress += Math.floor(Math.random() * 15) + 5;
      
      if (activity.progress >= 100) {
        activity.progress = 100;
        activity.status = Math.random() > 0.2 ? 'completed' : 'failed';
        activity.finished = new Date().toISOString();
        activity.summaryMessage = activity.status === 'completed' 
          ? 'Completed successfully' 
          : 'Failed';
        
        if (activity.status === 'failed') {
          activity.errorMessage = 'Mock error: Process terminated unexpectedly';
        }
        
        this.send({
          type: `activity:${activity.status}`,
          data: { ...activity }
        });
        
        clearInterval(interval);
      } else {
        activity.summaryMessage = `Processing... ${activity.progress}%`;
        this.send({
          type: 'activity:updated',
          data: { ...activity }
        });
      }
    }, 1500);
  }
}

// Mock HTTP API
export const mockActivityApi = {
  getAllActivities: () => {
    return Promise.resolve({
      success: true,
      activities: mockActivities
    });
  },

  getActivity: (id) => {
    const activity = mockActivities.find(a => a.id === id);
    return Promise.resolve({
      success: !!activity,
      activity: activity || null
    });
  },

  markActivityAsRead: (id) => {
    const activity = mockActivities.find(a => a.id === id);
    if (activity) {
      activity.read = true;
    }
    return Promise.resolve({ success: true });
  },

  markAllActivitiesAsRead: () => {
    mockActivities.forEach(a => {
      if (['completed', 'failed'].includes(a.status)) {
        a.read = true;
      }
    });
    return Promise.resolve({ success: true });
  },

  clearCompletedActivities: (olderThanDays) => {
    const cutoff = new Date(Date.now() - (olderThanDays * 24 * 60 * 60 * 1000));
    mockActivities = mockActivities.filter(a => {
      const isCompleted = ['completed', 'failed'].includes(a.status);
      if (!isCompleted) return true;
      
      const activityDate = new Date(a.finished || a.started);
      return activityDate >= cutoff;
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
export let mockActivityWS = null;

export function createMockActivityWebSocket() {
  mockActivityWS = new MockActivityWebSocket();
  return mockActivityWS;
}

// Expose to dev tools for manual testing
if (typeof window !== 'undefined') {
  window.__mockActivityWS = mockActivityWS;
}
