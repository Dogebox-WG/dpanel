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
        ],
        loading: false,
        error: null,
      },
    });
  });

  it("updates orphaned jobs and removes deleted jobs", () => {
    jobWebSocket.handleMessage({
      type: "job:orphaned",
      update: {
        id: "job-1",
        status: "orphaned",
        progress: 30,
        summaryMessage: "Job marked as orphaned",
        errorMessage: "Job is no longer being processed",
      },
    });

    expect(store.jobsContext.jobs[0].status).to.equal("orphaned");
    expect(store.jobsContext.jobs[0].errorMessage).to.equal("Job is no longer being processed");

    jobWebSocket.handleMessage({
      type: "job:deleted",
      update: { id: "job-1" },
    });

    expect(store.jobsContext.jobs).to.deep.equal([]);
  });
});
