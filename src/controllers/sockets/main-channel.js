import WebSocketClient from "/api/sockets.js";
import { store } from "/state/store.js";
import { pkgController } from "/controllers/package/index.js";
import { sysController } from "/controllers/system/index.js";
import { pupUpdates } from "/state/pup-updates.js";
import { asyncTimeout } from "/utils/timeout.js";
import { performMockCycle, c1, c4, c5, mockInstallEvent } from "/api/mocks/pup-state-cycle.js";
import { isUnauthedRoute } from "/utils/url-utils.js";

async function mockedMainChannelRunner(onMessageCallback) {
  if (store.networkContext.demoSystemPrompt) {
    setTimeout(() => {
      const mockData = {
        type: "ShowPrompt",
        name: store.networkContext.demoSystemPrompt,
      };
      onMessageCallback({ data: JSON.stringify(mockData) });
    }, 2000);
  }

  if (store.networkContext.demoInstallPup) {
    setTimeout(() => {
      onMessageCallback({
        data: JSON.stringify(installEvent)
      })
    }, 3000)
  }

  if (store.networkContext.demoPupLifecycle) {
    await performMockCycle(c5, (statusUpdate) => onMessageCallback({ data: JSON.stringify(statusUpdate) }))
  }
}

class SocketChannel {
  observers = [];
  reconnectInterval = 500;
  maxReconnectInterval = 10000;
  recoveryLogs = ["Connecting to WebSocket"];

  constructor() {
    this.wsClient = null;
    this.isConnected = false;
    
    this.setupSocketConnection();

    if (!this.isConnected) {
      this.wsClient && this.wsClient.connect();
    }
  }

  setupSocketConnection() {
    if (this.isConnected) {
      return;
    }

    if (isUnauthedRoute()) {
      return;
    }

    const wsUrl = `${store.networkContext.wsApiBaseUrl}/ws/state/`;
    
    this.wsClient = new WebSocketClient(
      wsUrl,
      store.networkContext,
      mockedMainChannelRunner,
    );

    // Update component state based on WebSocket events
    this.wsClient.onOpen = () => {
        
      this.isConnected = true;
      this.reconnectInterval = 1000; // reset.
      console.log("CONNECTED!!");
      this.recoveryLogs = [...this.recoveryLogs, "Websocket connected"];
      this.notify();
    };

    this.wsClient.onMessage = async (event) => {

      let err, data;
      try {
        data = JSON.parse(event.data);
      } catch (err) {
        console.warn("failed to JSON.parse incoming event", event, err);
        err = true;
      }

      if (err || !data) return;

      // Switch on message type
      if (!data.type) {
        console.warn("received an event that lacks an event type", event);
        return;
      }

      switch (data.type) {
        case "bootstrap":
          // Initial websocket bootstrap snapshot.
          // The app also fetches bootstrap over HTTP on load; this is mainly useful for debugging.
          if (store.networkContext.logBootstrapUpdates) {
            console.log("[MainChannel] ws bootstrap received", { seq: data.seq, ts: data.ts });
          }
          // Optionally apply; keep it off by default to avoid surprising resets.
          // If you want to use it, toggle networkContext.logBootstrapUpdates and call pkgController.setData here.
          break;
        case "pup":
          // emitted on state change (eg: installing, ready)
          if (store.networkContext.logStateUpdates) {
            console.log(`##-STATE-## installation: ${data.update.installation}`, { seq: data.seq, ts: data.ts, payload: data.update });
          }
          pkgController.updatePupModel(data.update.id, data.update, { seq: data.seq, ts: data.ts })
          
          // Clear update info when pup is upgrading (version has changed, no longer "update available")
          if (data.update.installation === 'upgrading') {
            pupUpdates.clearUpdateInfo(data.update.id);
          }
          break;

        case "pup_purged":
          if (store.networkContext.logStateUpdates) {
            console.log("[MainChannel] pup_purged", { seq: data.seq, ts: data.ts, payload: data.update });
          }
          pkgController.removePupById(data?.update?.pupId, { seq: data.seq, ts: data.ts });
          break;

        case "stats":
          // emitted on an interval (contains current status and vitals)
          if (data && data.update && Array.isArray(data.update)) {
            data.update.forEach((statsUpdatePayload) => {
              if (store.networkContext.logStatsUpdates) {
                console.log('--STATS--', statsUpdatePayload.status, { seq: data.seq, ts: data.ts, payload: statsUpdatePayload });
              }
              pkgController.updatePupStatsModel(statsUpdatePayload.id, statsUpdatePayload, { seq: data.seq, ts: data.ts })
            });
          }
          break;

        case "action":
          // emitted in response to an action
          await asyncTimeout(500); // Why?
          
          // Check if this is a check-pup-updates action (system-wide action, not pup-specific)
          const isCheckUpdatesAction = data.update && 
            (data.update.pupsChecked !== undefined || 
             data.update.updateInfo !== undefined);
          
          if (isCheckUpdatesAction) {
            if (!data.error) {
            await pupUpdates.refresh();
            } else {
              console.error('[MainChannel] CheckPupUpdates action failed:', data.error);
            }
          } else {
            // Regular pup-specific action
            pkgController.resolveAction(data.id, data, { seq: data.seq, ts: data.ts });
          }
          break;

        case "prompt": // synthetic (client side only)
          store.updateState({
            promptContext: {
              display: true,
              name: data.name,
            },
          });
          break;

        case "progress":
          if (store.networkContext.logProgressUpdates) {
            console.log("--PROGRESS", { seq: data.seq, ts: data.ts, data });
          }
          pkgController.ingestProgressUpdate(data);
          break;

        case "system-update-available":
          sysController.ingestSystemUpdateAvailableEvent(data)
          break;

        case "recovery":
          console.log("--RECOVERY", data.update);
          this.recoveryLogs = [...this.recoveryLogs, data.update];
          break;

        case "job_created":
          if (data.update) {
            const existingJob = store.jobsContext.jobs.find(j => j.id === data.update.id);
            if (!existingJob) {
              store.updateState({
                jobsContext: {
                  activities: [...store.jobsContext.jobs, data.update]
                }
              });
            }
          }
          break;

        case "job_progress":
          if (data.update) {
            const activities = store.jobsContext.jobs.map(job =>
              job.id === data.update.id ? data.update : job
            );
            store.updateState({
              jobsContext: { activities }
            });
          }
          break;

        case "job_completed":
          if (data.update) {
            const activities = store.jobsContext.jobs.map(job =>
              job.id === data.update.id ? data.update : job
            );
            store.updateState({
              jobsContext: { activities }
            });
            
            // Clear update info when a pup is uninstalled or purged
            if (data.update.action && (data.update.action === 'uninstall' || data.update.action === 'purge')) {
              if (data.update.state && data.update.state.id) {
                pupUpdates.clearUpdateInfo(data.update.state.id);
              }
            }
          }
          break;

        case "pup-updates-checked":
          // Backend has completed checking for updates, refresh our cache
          console.log('[MainChannel] Received pup-updates-checked event, refreshing cache');
          pupUpdates.refresh();
          break;
      }
      this.notify();
    };

    this.wsClient.onError = (event) => {
      console.log("ERRORS", event);
      this.notify();
    };

    this.wsClient.onClose = (event) => {
      console.log("CLOSING");
      this.isConnected = false;
      this.notify();
      this.attemptReconnect();
    };
  }

  attemptReconnect() {
    if (!this.isConnected) {
      setTimeout(() => {
        console.log(`Attempting to reconnect...`);
        this.setupSocketConnection();
        if (!this.isConnected) {
          this.wsClient.connect();
        }
      }, this.reconnectInterval);

      // Increase the reconnect interval until the maximum (eg 10 seconds) is reached
      this.reconnectInterval = Math.min(
        this.reconnectInterval * 1.15,
        this.maxReconnectInterval,
      );
    }
  }

  // Register an observer
  addObserver(observer) {
    if (!this.observers.includes(observer)) {
      this.observers.push(observer);
    }
  }

  // Remove an observer
  removeObserver(observer) {
    const index = this.observers.indexOf(observer);
    if (index > -1) {
      this.observers.splice(index, 1);
    }
  }

  // Notify one or all registered observers of a change
  notify(id) {
    for (const observer of this.observers) {
      if (!id) {
        observer.requestUpdate();
      }
      if (id === observer.id) {
        observer.requestUpdate();
      }
    }
  }

  doThing() {
    this.notify();
  }

    // Get current messages
    getRecoveryLogs() {
      return this.recoveryLogs || [];
    }
  
    // Subscribe to message updates
    subscribeToRecoveryLogs(callback) {
      const messageObserver = {
        requestUpdate: () => {
          callback(this.recoveryLogs || []);
        }
      };
      this.addObserver(messageObserver);
      return () => this.removeObserver(messageObserver);
    }
}

// Instance holder
let instance;

function getInstance() {
  if (!instance) {
    instance = new SocketChannel();
  }
  return instance;
}

export const mainChannel = getInstance();
