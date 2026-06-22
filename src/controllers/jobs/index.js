import { store } from "/state/store.js";
import { isActiveJobStatus } from "/controllers/jobs/status.js";

class JobsController {
  constructor() {
    this.observers = new Set();
    this.bootstrapSystemUpdate = null;
    this.state = this.deriveState(store.getContext("jobs"));

    store.subscribe({
      stateChanged: () => {
        const jobsContext = store.getContext("jobs");
        if (jobsContext?.initialized) {
          this.bootstrapSystemUpdate = null;
        }
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
    const initialized = jobsContext?.initialized === true;
    const activeSystemUpdate =
      this.findActiveSystemUpdateJob(jobs) ||
      (!initialized ? this.createBootstrapFallbackJob() : null);
    const status = this.getDisplayStatus(activeSystemUpdate?.status);

    return {
      activeSystemUpdate,
      activeSystemUpdateJobId: activeSystemUpdate?.id || "",
      isSystemUpdateLocked: Boolean(activeSystemUpdate),
      systemUpdateStatus: status,
    };
  }

  findActiveSystemUpdateJob(jobs = []) {
    return jobs.find((job) => this.isSystemUpdateJobPending(job));
  }

  createBootstrapFallbackJob() {
    if (!this.bootstrapSystemUpdate?.id) {
      return null;
    }

    return {
      id: this.bootstrapSystemUpdate.id,
      action: "system-update",
      displayName: "System Update",
      status: this.bootstrapSystemUpdate.status,
      progress: 0,
      summaryMessage: "System update in progress",
      errorMessage: "",
    };
  }

  isSystemUpdateJobPending(job) {
    const action = (job?.action || "").toLowerCase();
    const status = (job?.status || "").toLowerCase();

    return action === "system-update" && isActiveJobStatus(status);
  }

  getDisplayStatus(status) {
    return ((status || "").toLowerCase() || "active").replace(/_/g, " ");
  }

  hydrateFromBootstrap(setupFacts = {}) {
    const jobId = setupFacts?.activeSystemUpdateJobId || "";
    const status = (setupFacts?.activeSystemUpdateStatus || "in_progress").toLowerCase();

    this.bootstrapSystemUpdate = jobId
      ? { id: jobId, status }
      : null;

    const nextState = this.deriveState(store.getContext("jobs"));
    const hasChanges = JSON.stringify(this.state) !== JSON.stringify(nextState);
    this.state = nextState;

    if (hasChanges) {
      this.notifyObservers();
    }
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

  getActiveSystemUpdate() {
    return this.state.activeSystemUpdate;
  }
}

export const jobsController = new JobsController();
