import { store } from "/state/store.js";

export interface SysObserver {
  requestUpdate(options?: Record<string, unknown>): void;
}

class SysController {
  observers: SysObserver[] = [];

  constructor() {}

  // Register an observer
  addObserver(observer: SysObserver) {
    if (!this.observers.includes(observer)) {
      this.observers.push(observer);
    }
  }

  // Remove an observer
  removeObserver(observer: SysObserver) {
    const index = this.observers.indexOf(observer);
    if (index > -1) {
      this.observers.splice(index, 1);
    }
  }

  // Notify all registered observers of a state change
  notify(options: Record<string, unknown> = {}) {
    for (const observer of this.observers) {
      observer.requestUpdate(options);
    }
  }

  ingestSystemUpdateAvailableEvent() {
    // When an update is available, Dogeboxd emits a 'system-update-available' event
    // We pay no regard to the payload. The fact the message is received
    // is sufficient enough to toggle the client state to show update indicators.
    let err: unknown;
    try {
      store.updateState({ sysContext: { updateAvailable: true } });
    } catch (caught) {
      err = caught;
      console.error("Failed to process system state update", caught);
    } finally {
      if (!err) this.notify();
    }
  }
}

export type { SysController };

// Instance holder
let instance: SysController | undefined;

function getInstance() {
  if (!instance) {
    instance = new SysController();
  }
  return instance;
}

export const sysController = getInstance();
