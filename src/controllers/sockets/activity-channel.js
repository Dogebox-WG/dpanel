import { store } from '/state/store.js';
import { createMockActivityWebSocket } from '/api/jobs/jobs.mocks.js';

/**
 * Activity WebSocket Channel
 * Handles real-time activity updates via WebSocket
 * Supports both mock and real backend modes
 */
class ActivityWebSocketService {
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
      this.ws = createMockActivityWebSocket();
      this.setupMockHandlers();
    } else {
      // Real mode: Try to connect, but fail gracefully if not available
      const token = store.networkContext.token;
      const wsUrl = `${wsApiBaseUrl}/ws/activities${token ? `?token=${token}` : ''}`;
      
      try {
        this.ws = new WebSocket(wsUrl);
        this.setupRealHandlers();
      } catch (error) {
        console.warn('[Activity WS] Backend activity system not available yet');
        // Set empty activities state
        store.updateState({
          jobsContext: { activities: [], loading: false }
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
          jobsContext: { activities: [], loading: false }
        });
      }
    };

    this.ws.onerror = () => {
      if (!this.backendAvailable) {
        // Backend activity system not available yet - gracefully degrade
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
          this.handleInitialActivities(data.jobs);
        }
        break;
      case 'activity:created':
        this.handleActivityCreated(data);
        break;
      case 'activity:updated':
        this.handleActivityUpdated(data);
        break;
      case 'activity:completed':
      case 'activity:failed':
      case 'activity:cancelled':
        this.handleActivityFinished(data);
        break;
      default:
        // Ignore other message types (pup updates, stats, etc.)
        break;
    }
  }

  handleInitialActivities(activities) {
    store.updateState({
      jobsContext: { 
        activities: Array.isArray(activities) ? activities : [],
        loading: false 
      }
    });
  }

  handleActivityCreated(activity) {
    const activities = [...store.jobsContext.activities, activity];
    store.updateState({
      jobsContext: { activities }
    });
  }

  handleActivityUpdated(activity) {
    const activities = store.jobsContext.activities.map(a =>
      a.id === activity.id ? { ...a, ...activity } : a
    );
    store.updateState({
      jobsContext: { activities }
    });
  }

  handleActivityFinished(activity) {
    const activities = store.jobsContext.activities.map(a =>
      a.id === activity.id ? { ...a, ...activity } : a
    );
    store.updateState({
      jobsContext: { activities }
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

  // Helper for dev tools - create mock activity
  createMockActivity(displayName) {
    if (this.isMockMode && this.ws) {
      this.ws.simulateActivityCreated(displayName);
    } else {
      console.warn('[Activity WS] Can only create mock activities in mock mode');
    }
  }
}

export const activityWebSocket = new ActivityWebSocketService();

// Expose to window for dev tools
if (typeof window !== 'undefined') {
  window.__activityWS = activityWebSocket;
}

