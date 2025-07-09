import WebSocketClient from "/api/sockets.js";
import { store } from "/state/store.js";
import { pkgController } from "/controllers/package/index.js";
import { sysController } from "/controllers/system/index.js";
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
        case "pup":
          // emitted on state change (eg: installing, ready)
          if (store.networkContext.logStateUpdates) {
                console.log(`##-STATE-## installation: ${data.update.installation}`, { payload: data.update });
              }
          pkgController.updatePupModel(data.update.id, data.update)
          break;

        case "stats":
          // emitted on an interval (contains current status and vitals)
          if (data && data.update && Array.isArray(data.update)) {
            data.update.forEach((statsUpdatePayload) => {
              if (store.networkContext.logStatsUpdates) {
                console.log('--STATS--', statsUpdatePayload.status, { payload: statsUpdatePayload });
              }
              pkgController.updatePupStatsModel(statsUpdatePayload.id, statsUpdatePayload)
            });
          }
          break;

        case "action":
          // emitted in response to an action
          await asyncTimeout(500); // Why?
          pkgController.resolveAction(data.id, data);
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
            console.log("--PROGRESS", data);
          }
          pkgController.ingestProgressUpdate(data);
          break;

        case "system-state":
          sysController.ingestSystemStateUpdate(data)
          break;

        case "recovery":
          console.log("--RECOVERY", data.update);
          this.recoveryLogs = [...this.recoveryLogs, data.update];
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
      console.log("OBSERVER ADDED", observer);
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
