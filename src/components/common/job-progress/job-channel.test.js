import { expect } from "../../../../dev/node_modules/@open-wc/testing";

import { store } from "/state/store.js";
import { jobWebSocket } from "/controllers/sockets/job-channel.js";

describe("jobWebSocket", () => {
  beforeEach(() => {
    store.updateState({
      jobsContext: {
        jobs: [
          {
            id: "job-1",
            displayName: "Tracked Job",
            status: "in_progress",
            progress: 30,
            summaryMessage: "Running",
            errorMessage: null,
            started: new Date().toISOString(),
            finished: null,
          },
          {
            id: "job-2",
            displayName: "Queued Job",
            status: "queued",
            progress: 0,
            summaryMessage: "Queued",
            errorMessage: null,
            started: new Date().toISOString(),
            finished: null,
          },
        ],
        loading: false,
        error: null,
      },
    });
  });

  it("merges orphaned job updates without disturbing other jobs", () => {
    jobWebSocket.handleMessage({
      type: "job:orphaned",
      update: {
        id: "job-1",
        status: "orphaned",
        progress: 42,
        summaryMessage: "Marked as orphaned",
        errorMessage: "Job is no longer being processed",
      },
    });

    expect(store.jobsContext.jobs[0]).to.include({
      id: "job-1",
      displayName: "Tracked Job",
      status: "orphaned",
      progress: 42,
      summaryMessage: "Marked as orphaned",
      errorMessage: "Job is no longer being processed",
    });
    expect(store.jobsContext.jobs[1]).to.include({
      id: "job-2",
      displayName: "Queued Job",
      status: "queued",
      progress: 0,
    });
  });

  it("removes only the deleted job", () => {
    jobWebSocket.handleMessage({
      type: "job:deleted",
      update: { id: "job-1" },
    });

    expect(store.jobsContext.jobs).to.have.length(1);
    expect(store.jobsContext.jobs[0]).to.include({
      id: "job-2",
      displayName: "Queued Job",
      status: "queued",
    });
  });
});
