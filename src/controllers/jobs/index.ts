import { store } from "/state/store.js";
import type { JobsContext } from "/state/store.js";
import { isActiveJobStatus } from "/controllers/jobs/status.js";
import type { JobRecord, JobStatus } from "/types/jobs";
import type { BootstrapFacts } from "/types/bootstrap";

/**
 * Synthetic job used before the jobs bootstrap arrives, built from the
 * bootstrap setupFacts. Shaped like a JobRecord for display purposes but
 * without the persistence-only fields.
 */
export interface BootstrapFallbackJob {
  id: string;
  action: "system-update";
  displayName: string;
  status: JobStatus | string;
  progress: number;
  summaryMessage: string;
  errorMessage: string;
}

export type ActiveSystemUpdate = JobRecord | BootstrapFallbackJob;

export interface JobsControllerState {
  activeSystemUpdate: ActiveSystemUpdate | null;
  activeSystemUpdateJobId: string;
  isSystemUpdateLocked: boolean;
  systemUpdateStatus: string;
}

export interface JobsObserver {
  onJobsUpdate?: (state: JobsControllerState) => void;
}

interface BootstrapSystemUpdate {
  id: string;
  status: string;
}

class JobsController {
  observers = new Set<JobsObserver>();
  bootstrapSystemUpdate: BootstrapSystemUpdate | null = null;
  state: JobsControllerState;

  constructor() {
    this.state = this.deriveState(store.getContext("jobs") ?? undefined);

    store.subscribe({
      stateChanged: () => {
        const jobsContext = store.getContext("jobs");
        if (jobsContext?.initialized) {
          this.bootstrapSystemUpdate = null;
        }
        const nextState = this.deriveState(jobsContext ?? undefined);
        const hasChanges =
          JSON.stringify(this.state) !== JSON.stringify(nextState);

        if (hasChanges) {
          this.state = nextState;
          this.notifyObservers();
        }
      },
    });
  }

  deriveState(jobsContext: Partial<JobsContext> = {}): JobsControllerState {
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

  findActiveSystemUpdateJob(jobs: JobRecord[] = []): JobRecord | undefined {
    return jobs.find((job) => this.isSystemUpdateJobPending(job));
  }

  createBootstrapFallbackJob(): BootstrapFallbackJob | null {
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

  isSystemUpdateJobPending(job: Partial<JobRecord> | null | undefined): boolean {
    const action = (job?.action || "").toLowerCase();
    const status = (job?.status || "").toLowerCase();

    return action === "system-update" && isActiveJobStatus(status);
  }

  getDisplayStatus(status: string | undefined): string {
    return ((status || "").toLowerCase() || "active").replace(/_/g, " ");
  }

  hydrateFromBootstrap(setupFacts: Partial<BootstrapFacts> = {}): void {
    const jobId = setupFacts?.activeSystemUpdateJobId || "";
    const status = (
      setupFacts?.activeSystemUpdateStatus || "in_progress"
    ).toLowerCase();

    this.bootstrapSystemUpdate = jobId ? { id: jobId, status } : null;

    const nextState = this.deriveState(store.getContext("jobs") ?? undefined);
    const hasChanges = JSON.stringify(this.state) !== JSON.stringify(nextState);
    this.state = nextState;

    if (hasChanges) {
      this.notifyObservers();
    }
  }

  addObserver(observer: JobsObserver): void {
    if (observer && typeof observer === "object") {
      this.observers.add(observer);
    }
  }

  removeObserver(observer: JobsObserver): void {
    if (observer && this.observers.has(observer)) {
      this.observers.delete(observer);
    }
  }

  notifyObservers(): void {
    for (const observer of this.observers) {
      if (typeof observer?.onJobsUpdate === "function") {
        observer.onJobsUpdate(this.state);
      }
    }
  }

  isSystemUpdateLocked(): boolean {
    return this.state.isSystemUpdateLocked;
  }

  getActiveSystemUpdateStatus(): string {
    return this.state.systemUpdateStatus;
  }

  getActiveSystemUpdate(): ActiveSystemUpdate | null {
    return this.state.activeSystemUpdate;
  }
}

export type { JobsController };

export const jobsController = new JobsController();
