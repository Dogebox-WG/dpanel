import { store } from "/state/store.js";
import { createMockJobWebSocket } from "/api/jobs/jobs.mocks.js";
import type { MockJobWebSocket } from "/api/jobs/jobs.mocks.js";
import type { JobChannelMessage } from "/types/websocket";
import type { JobRecord } from "/types/jobs";

/**
 * Job WebSocket Channel
 * Handles real-time job updates via WebSocket
 * Supports both mock and real backend modes
 */
class JobWebSocketService {
  ws: WebSocket | MockJobWebSocket | null;
  reconnectAttempts: number;
  maxReconnectAttempts: number;
  isMockMode: boolean;
  backendAvailable: boolean;

  constructor() {
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.isMockMode = false;
    this.backendAvailable = false;
  }

  connect(): void {
    const { useMocks, wsApiBaseUrl } = store.networkContext;
    this.isMockMode = Boolean(useMocks);

    if (!store.jobsContext.initialized) {
      store.updateState({
        jobsContext: { loading: true },
      });
    }

    if (this.ws) {
      if (this.isMockMode && (this.ws as MockJobWebSocket).connected) {
        return;
      }

      if (
        !this.isMockMode &&
        ((this.ws as WebSocket).readyState === WebSocket.OPEN ||
          (this.ws as WebSocket).readyState === WebSocket.CONNECTING)
      ) {
        return;
      }
    }

    if (this.isMockMode) {
      this.ws = createMockJobWebSocket();
      this.setupMockHandlers();
    } else {
      // Real mode: Try to connect, but fail gracefully if not available
      const token = store.networkContext.token;
      const wsUrl = `${wsApiBaseUrl}/ws/jobs${token ? `?token=${token}` : ""}`;

      try {
        this.ws = new WebSocket(wsUrl);
        this.setupRealHandlers();
      } catch (error) {
        console.warn("[Job WS] Backend job system not available yet");
        // Set empty jobs state
        store.updateState({
          jobsContext: { jobs: [], loading: false, initialized: true },
        });
      }
    }
  }

  setupMockHandlers(): void {
    const ws = this.ws as MockJobWebSocket;

    ws.on("open", () => {
      this.reconnectAttempts = 0;
    });

    ws.on("message", (event) => {
      // The mock always attaches a payload to "message" events.
      const message = JSON.parse(event!.data) as JobChannelMessage;
      this.handleMessage(message);
    });

    ws.on("close", () => {
      // Mock disconnected
    });

    ws.connect();
  }

  setupRealHandlers(): void {
    const ws = this.ws as WebSocket;

    ws.onopen = () => {
      this.reconnectAttempts = 0;
      this.backendAvailable = true;
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as JobChannelMessage;
        this.handleMessage(message);
      } catch (err) {
        console.error("[Activity WS] Failed to parse message:", err);
      }
    };

    ws.onclose = () => {
      if (this.backendAvailable) {
        this.attemptReconnect();
      } else {
        store.updateState({
          jobsContext: { jobs: [], loading: false, initialized: true },
        });
      }
    };

    ws.onerror = () => {
      if (!this.backendAvailable) {
        // Backend job system not available yet - gracefully degrade
      }
    };
  }

  handleMessage(message: JobChannelMessage): void {
    const { type } = message;

    switch (type) {
      case "bootstrap":
        if (message.update && Array.isArray(message.update.jobs)) {
          this.handleInitialJobs(message.update.jobs);
        }
        break;
      case "job:created":
        this.handleJobCreated(message.update);
        break;
      case "job:updated":
      case "job:completed":
      case "job:failed":
      case "job:cancelled":
      case "job:orphaned":
        this.handleJobUpdated(message.update);
        break;
      case "job:deleted":
        this.handleJobDeleted(message.update);
        break;
      default:
        // Ignore other message types (pup updates, stats, etc.)
        break;
    }
  }

  handleInitialJobs(jobs: JobRecord[]): void {
    store.updateState({
      jobsContext: {
        jobs: Array.isArray(jobs) ? jobs : [],
        initialized: true,
        loading: false,
      },
    });

    // Trigger pkgController to re-derive status for all pups now that jobs are loaded
    // This ensures pups with active jobs show correct "stopping"/"starting" status
    import("/controllers/package/index.js").then((m) => {
      m.pkgController.recomputeAllDerivedValues();
    });
  }

  handleJobCreated(job: JobRecord): void {
    const existingJobs = Array.isArray(store.jobsContext.jobs) ? store.jobsContext.jobs : [];
    const existingIndex = existingJobs.findIndex((item) => item.id === job?.id);
    const jobs = existingIndex === -1
      ? [...existingJobs, job]
      : existingJobs.map((item, index) => (index === existingIndex ? { ...item, ...job } : item));
    store.updateState({
      jobsContext: { jobs },
    });
  }

  handleJobUpdated(job: JobRecord): void {
    const existingJobs = Array.isArray(store.jobsContext.jobs) ? store.jobsContext.jobs : [];
    const hasExistingJob = existingJobs.some((item) => item.id === job?.id);
    const jobs = hasExistingJob
      ? existingJobs.map((item) => (item.id === job.id ? { ...item, ...job } : item))
      : [...existingJobs, job];
    store.updateState({
      jobsContext: { jobs },
    });
  }

  handleJobDeleted(job: JobRecord): void {
    const jobs = store.jobsContext.jobs.filter((j) => j.id !== job?.id);
    store.updateState({
      jobsContext: { jobs },
    });
  }

  attemptReconnect(): void {
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

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  // Helper for dev tools - create mock job
  createMockJob(displayName?: string): void {
    if (this.isMockMode && this.ws) {
      (this.ws as MockJobWebSocket).simulateJobCreated(displayName);
    } else {
      console.warn("[Job WS] Can only create mock jobs in mock mode");
    }
  }
}

export type { JobWebSocketService };

export const jobWebSocket = new JobWebSocketService();

// Expose to window for dev tools
if (typeof window !== "undefined") {
  (window as unknown as Record<string, unknown>).__jobWS = jobWebSocket;
}
