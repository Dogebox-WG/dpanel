import { store } from "/state/store.js";

class SysController {
  observers = [];

  constructor() {}

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

  // Notify all registered observers of a state change
  notify(options = {}) {
    for (const observer of this.observers) {
      observer.requestUpdate(options);
    }
  }

  ingestSystemUpdatesAvailable() {
    // When an update is available, Dogeboxd emits a 'system-update-available' event
    // We pay no regard to the payload. The fact the message is received
    // is sufficient enough to toggle the client state to show update indicators.
    let err;
    try {
      store.updateState({ sysContext: { updateAvailable: true }});
    } catch (err) {
      console.error('Failed to process system state update', err);
    } finally {
      if (!err) this.notify();
    }
  }
}

// Instance holder
let instance;

function getInstance() {
  if (!instance) {
    instance = new SysController();
  }
  return instance;
}

export const sysController = getInstance();