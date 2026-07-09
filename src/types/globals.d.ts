import type { JobWebSocketService } from "/controllers/sockets/job-channel";
import type { MockJobWebSocket } from "/api/jobs/jobs.mocks";

/**
 * Dev-tools globals attached to `window` for manual testing. These are only
 * populated in the browser and are optional so production code can't rely on
 * them without a guard.
 */
declare global {
  interface Window {
    __jobWS?: JobWebSocketService;
    __mockJobWS?: MockJobWebSocket | null;
    pupUpdates?: {
      reconcile: () => void;
      clearAll: () => void;
    };
  }
}

export {};
