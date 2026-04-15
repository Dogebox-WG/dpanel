import { expect } from "../../../dev/node_modules/@open-wc/testing";

import { store } from "/state/store.js";
import { jobsController } from "/controllers/jobs/index.js";

describe("jobsController", () => {
  beforeEach(() => {
    jobsController.hydrateFromBootstrap({});
    store.updateState({
      jobsContext: {
        jobs: [],
        initialized: false,
        loading: false,
        error: null,
      },
    });
  });

  it("uses bootstrap system update state before jobs bootstrap arrives", () => {
    jobsController.hydrateFromBootstrap({
      activeSystemUpdateJobId: "system-job-1",
      activeSystemUpdateStatus: "in_progress",
    });

    expect(jobsController.isSystemUpdateLocked()).to.equal(true);
    expect(jobsController.getActiveSystemUpdate()).to.include({
      id: "system-job-1",
      action: "system-update",
      status: "in_progress",
    });
  });

  it("tracks active system updates by action instead of display name", () => {
    store.updateState({
      jobsContext: {
        jobs: [
          {
            id: "system-job-2",
            action: "system-update",
            displayName: "Upgrade the box",
            status: "queued",
            progress: 0,
            summaryMessage: "Queued",
            errorMessage: "",
          },
        ],
        initialized: true,
      },
    });

    expect(jobsController.isSystemUpdateLocked()).to.equal(true);
    expect(jobsController.getActiveSystemUpdateStatus()).to.equal("queued");
    expect(jobsController.getActiveSystemUpdate()).to.include({
      id: "system-job-2",
      action: "system-update",
    });
  });

  it("clears bootstrap fallback once jobs bootstrap confirms no active update", () => {
    jobsController.hydrateFromBootstrap({
      activeSystemUpdateJobId: "system-job-3",
      activeSystemUpdateStatus: "queued",
    });

    store.updateState({
      jobsContext: {
        jobs: [],
        initialized: true,
      },
    });

    expect(jobsController.isSystemUpdateLocked()).to.equal(false);
    expect(jobsController.getActiveSystemUpdate()).to.equal(null);
  });
});
