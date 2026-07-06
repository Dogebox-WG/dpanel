import WebSocketClient from "/api/sockets.js";
import type { SocketMessageEvent } from "/api/sockets.js";
import { store } from "/state/store.js";
import { pkgController } from "/controllers/package/index.js";
import { sysController } from "/controllers/system/index.js";
import { pupUpdates } from "/state/pup-updates.js";
import { asyncTimeout } from "/utils/timeout.js";
import {
  performMockCycle,
  c5,
  mockInstallEvent,
} from "/api/mocks/pup-state-cycle.js";
import { isUnauthedRoute } from "/utils/url-utils.js";
import type { MainChannelMessage } from "/types/websocket";
import type { JobRecord } from "/types/jobs";

interface CheckUpdatesActionResult {
  pupsChecked?: unknown;
  updateInfo?: unknown;
}

export interface MainChannelObserver {
  id?: string;
  requestUpdate(): void;
}

async function mockedMainChannelRunner(
  onMessageCallback: (event: SocketMessageEvent) => void,
): Promise<void> {
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
        data: JSON.stringify(mockInstallEvent),
      });
    }, 3000);
  }

  if (store.networkContext.demoPupLifecycle) {
    await performMockCycle(c5, (statusUpdate) =>
      onMessageCallback({ data: JSON.stringify(statusUpdate) }),
    );
  }
}

class SocketChannel {
  observers: MainChannelObserver[] = [];
  reconnectInterval = 500;
  maxReconnectInterval = 10000;
  recoveryLogs: string[] = ["Connecting to WebSocket"];
  wsClient: WebSocketClient | null;
  isConnected: boolean;

  constructor() {
    this.wsClient = null;
    this.isConnected = false;

    this.setupSocketConnection();

    // Cast needed: TS narrows wsClient to null from the assignment above and
    // cannot see that setupSocketConnection() may have reassigned it.
    const client = this.wsClient as WebSocketClient | null;
    if (!this.isConnected && client) {
      client.connect();
    }
  }

  setupSocketConnection(): void {
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
      let data: MainChannelMessage | undefined;
      try {
        data = JSON.parse(event.data) as MainChannelMessage;
      } catch (parseErr) {
        console.warn("failed to JSON.parse incoming event", event, parseErr);
      }

      if (!data) return;

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
          pkgController.updatePupModel(data.update.id, data.update, { seq: data.seq, ts: data.ts });

          // Clear update info when pup is upgrading (version has changed, no longer "update available")
          if (data.update.installation === "upgrading") {
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
            const { seq, ts } = data;
            data.update.forEach((statsUpdatePayload) => {
              if (store.networkContext.logStatsUpdates) {
                console.log("--STATS--", statsUpdatePayload.status, { seq, ts, payload: statsUpdatePayload });
              }
              pkgController.updatePupStatsModel(statsUpdatePayload.id, statsUpdatePayload, { seq, ts });
            });
          }
          break;

        case "action": {
          // emitted in response to an action
          await asyncTimeout(500); // Why?

          // Check if this is a check-pup-updates action (system-wide action, not pup-specific)
          const actionResult = data.update as CheckUpdatesActionResult | undefined;
          const isCheckUpdatesAction =
            actionResult &&
            (actionResult.pupsChecked !== undefined ||
              actionResult.updateInfo !== undefined);

          if (isCheckUpdatesAction) {
            if (!data.error) {
              await pupUpdates.refresh();
            } else {
              console.error("[MainChannel] CheckPupUpdates action failed:", data.error);
            }
          } else {
            // Regular pup-specific action
            pkgController.resolveAction(data.id, data, { seq: data.seq, ts: data.ts });
          }
          break;
        }

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
          // The payload carries no useful information; receiving the event is enough.
          sysController.ingestSystemUpdateAvailableEvent();
          break;

        case "recovery":
          console.log("--RECOVERY", data.update);
          this.recoveryLogs = [...this.recoveryLogs, data.update];
          break;

        case "job_completed": {
          // Legacy underscore event still emitted by the SystemUpdater
          // completion path; regular job lifecycle events are handled by
          // the jobs channel (job-channel).
          const update: JobRecord | undefined = data.update;
          if (update) {
            const jobs = store.jobsContext.jobs.map((job) =>
              job.id === update.id ? update : job,
            );
            store.updateState({
              jobsContext: { jobs },
            });

            // Clear update info when a pup is uninstalled or purged
            if (update.action === "uninstall" || update.action === "purge") {
              if (update.pupID) {
                pupUpdates.clearUpdateInfo(update.pupID);
              }
            }
          }
          break;
        }

        case "pup-updates-checked":
          // Backend has completed checking for updates, refresh our cache
          pupUpdates.refresh();
          break;
      }
      this.notify();
    };

    this.wsClient.onError = (event) => {
      console.log("ERRORS", event);
      this.notify();
    };

    this.wsClient.onClose = () => {
      console.log("CLOSING");
      this.isConnected = false;
      this.notify();
      this.attemptReconnect();
    };
  }

  attemptReconnect(): void {
    if (!this.isConnected) {
      setTimeout(() => {
        console.log(`Attempting to reconnect...`);
        this.setupSocketConnection();
        if (!this.isConnected) {
          this.wsClient?.connect();
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
  addObserver(observer: MainChannelObserver): void {
    if (!this.observers.includes(observer)) {
      this.observers.push(observer);
    }
  }

  // Remove an observer
  removeObserver(observer: MainChannelObserver): void {
    const index = this.observers.indexOf(observer);
    if (index > -1) {
      this.observers.splice(index, 1);
    }
  }

  // Notify one or all registered observers of a change
  notify(id?: string): void {
    for (const observer of this.observers) {
      if (!id) {
        observer.requestUpdate();
      }
      if (id === observer.id) {
        observer.requestUpdate();
      }
    }
  }

  doThing(): void {
    this.notify();
  }

  // Get current messages
  getRecoveryLogs(): string[] {
    return this.recoveryLogs || [];
  }

  // Subscribe to message updates
  subscribeToRecoveryLogs(callback: (logs: string[]) => void): () => void {
    const messageObserver: MainChannelObserver = {
      requestUpdate: () => {
        callback(this.recoveryLogs || []);
      },
    };
    this.addObserver(messageObserver);
    return () => this.removeObserver(messageObserver);
  }
}

export type { SocketChannel };

// Instance holder
let instance: SocketChannel | undefined;

function getInstance(): SocketChannel {
  if (!instance) {
    instance = new SocketChannel();
  }
  return instance;
}

export const mainChannel = getInstance();
