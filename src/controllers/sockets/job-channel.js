import { store } from '/state/store.js';
import { createMockJobWebSocket } from '/api/jobs/jobs.mocks.js';

/**
 * Job WebSocket Channel
 * Handles real-time job updates via WebSocket
 * Supports both mock and real backend modes
 */
class JobWebSocketService {
  constructor() {
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.isMockMode = false;
    this.backendAvailable = false;
  }

  connect() {
    const { useMocks, wsApiBaseUrl } = store.networkContext;
    this.isMockMode = useMocks;

    if (this.isMockMode) {
      this.ws = createMockJobWebSocket();
      this.setupMockHandlers();
    } else {
      // Real mode: Try to connect, but fail gracefully if not available
      const token = store.networkContext.token;
      const wsUrl = `${wsApiBaseUrl}/ws/jobs${token ? `?token=${token}` : ''}`;
      
      try {
        this.ws = new WebSocket(wsUrl);
        this.setupRealHandlers();
      } catch (error) {
        console.warn('[Job WS] Backend job system not available yet');
        // Set empty jobs state
        store.updateState({
          jobsContext: { jobs: [], loading: false }
        });
      }
    }
  }

  setupMockHandlers() {
    this.ws.on('open', () => {
      this.reconnectAttempts = 0;
    });

    this.ws.on('message', (event) => {
      const message = JSON.parse(event.data);
      this.handleMessage(message);
    });

    this.ws.on('close', () => {
      // Mock disconnected
    });

    this.ws.connect();
  }

  setupRealHandlers() {
    this.ws.onopen = () => {
      this.reconnectAttempts = 0;
      this.backendAvailable = true;
    };

    this.ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        this.handleMessage(message);
      } catch (err) {
        console.error('[Activity WS] Failed to parse message:', err);
      }
    };

    this.ws.onclose = () => {
      if (this.backendAvailable) {
        this.attemptReconnect();
      } else {
        store.updateState({
          jobsContext: { jobs: [], loading: false }
        });
      }
    };

    this.ws.onerror = () => {
      if (!this.backendAvailable) {
        // Backend job system not available yet - gracefully degrade
      }
    };
  }

  handleMessage(message) {
    const { type, update } = message;
    
    // Backend sends 'update' field, not 'data'
    const data = update;

    switch (type) {
      case 'bootstrap':
        // Initial connection sends bootstrap with all jobs
        if (data && Array.isArray(data.jobs)) {
          this.handleInitialJobs(data.jobs);
        }
        break;
      case 'job:created':
        this.handleJobCreated(data);
        break;
      case 'job:updated':
        this.handleJobUpdated(data);
        break;
      case 'job:completed':
      case 'job:failed':
      case 'job:cancelled':
        this.handleJobFinished(data);
        break;
      default:
        // Ignore other message types (pup updates, stats, etc.)
        break;
    }
  }

  handleInitialJobs(jobs) {
    store.updateState({
      jobsContext: { 
        jobs: Array.isArray(jobs) ? jobs : [],
        loading: false 
      }
    });
    
    // Trigger pkgController to re-derive status for all pups now that jobs are loaded
    // This ensures pups with active jobs show correct "stopping"/"starting" status
    import('/controllers/package/index.js').then(m => {
      m.pkgController.recomputeAllDerivedValues();
    });
  }

  handleJobCreated(job) {
    const jobs = [...store.jobsContext.jobs, job];
    store.updateState({
      jobsContext: { jobs }
    });
  }

  handleJobUpdated(job) {
    const jobs = store.jobsContext.jobs.map(j =>
      j.id === job.id ? { ...j, ...job } : j
    );
    store.updateState({
      jobsContext: { jobs }
    });
  }

  handleJobFinished(job) {
    const jobs = store.jobsContext.jobs.map(j =>
      j.id === job.id ? { ...j, ...job } : j
    );
    store.updateState({
      jobsContext: { jobs }
    });
  }

  attemptReconnect() {
    if (this.isMockMode) {
      // Don't reconnect in mock mode
      return;
    }
    
    // Only reconnect if we previously had a successful connection
    if (!this.backendAvailable || this.reconnectAttempts >= this.maxReconnectAttempts) {
      return;
    }
    
    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    setTimeout(() => this.connect(), delay);
  }

  disconnect() {
    if (this.ws) {
      if (this.isMockMode) {
        this.ws.close();
      } else {
        this.ws.close();
      }
      this.ws = null;
    }
  }

  // Helper for dev tools - create mock job
  createMockJob(displayName) {
    if (this.isMockMode && this.ws) {
      this.ws.simulateJobCreated(displayName);
    } else {
      console.warn('[Job WS] Can only create mock jobs in mock mode');
    }
  }
}

export const jobWebSocket = new JobWebSocketService();

// Expose to window for dev tools
if (typeof window !== 'undefined') {
  window.__jobWS = jobWebSocket;
}

