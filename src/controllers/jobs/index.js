import { store } from "/state/store.js";

class JobsController {
  constructor() {
    this.observers = new Set();
    this.state = this.deriveState(store.getContext("jobs"));

    store.subscribe({
      stateChanged: () => {
        const jobsContext = store.getContext("jobs");
        const nextState = this.deriveState(jobsContext);
        const hasChanges = JSON.stringify(this.state) !== JSON.stringify(nextState);

        if (hasChanges) {
          this.state = nextState;
          this.notifyObservers();
        }
      },
    });
  }

  deriveState(jobsContext = {}) {
    const jobs = Array.isArray(jobsContext?.jobs) ? jobsContext.jobs : [];
    const activeSystemUpdate = jobs.find((job) => this.isJobPending(job, "system update"));
    const status = ((activeSystemUpdate?.status || "").toLowerCase() || "active").replace(/_/g, " ");

    return {
      activeSystemUpdate,
      isSystemUpdateLocked: Boolean(activeSystemUpdate),
      systemUpdateStatus: status,
    };
  }

  isJobPending(job, matchText) {
    const name = (job?.displayName || "").toLowerCase();
    const statusesToIgnore = ["completed", "failed", "cancelled"];
    const status = (job?.status || "").toLowerCase();

    return (
      name.includes(matchText.toLowerCase()) && !statusesToIgnore.includes(status)
    );
  }

  addObserver(observer) {
    if (observer && typeof observer === "object") {
      this.observers.add(observer);
    }
  }

  removeObserver(observer) {
    if (observer && this.observers.has(observer)) {
      this.observers.delete(observer);
    }
  }

  notifyObservers() {
    for (const observer of this.observers) {
      if (typeof observer?.onJobsUpdate === "function") {
        observer.onJobsUpdate(this.state);
      }
    }
  }

  isSystemUpdateLocked() {
    return this.state.isSystemUpdateLocked;
  }

  getActiveSystemUpdateStatus() {
    return this.state.systemUpdateStatus;
  }
}

export const jobsController = new JobsController();
