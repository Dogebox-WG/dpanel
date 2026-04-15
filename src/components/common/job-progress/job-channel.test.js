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
            action: "install",
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
            action: "install",
            displayName: "Queued Job",
            status: "queued",
            progress: 0,
            summaryMessage: "Queued",
            errorMessage: null,
            started: new Date().toISOString(),
            finished: null,
          },
        ],
        initialized: true,
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

  it("upserts created jobs instead of duplicating seeded placeholders", () => {
    store.updateState({
      jobsContext: {
        jobs: [
          ...store.jobsContext.jobs,
          {
            id: "job-3",
            action: "system-update",
            displayName: "System Update",
            status: "queued",
            progress: 0,
            summaryMessage: "System update queued",
            errorMessage: "",
            started: new Date().toISOString(),
            finished: null,
          },
        ],
      },
    });

    jobWebSocket.handleMessage({
      type: "job:created",
      update: {
        id: "job-3",
        action: "system-update",
        displayName: "System Update",
        status: "in_progress",
        progress: 25,
        summaryMessage: "Applying upgrade",
      },
    });

    const matchingJobs = store.jobsContext.jobs.filter((job) => job.id === "job-3");
    expect(matchingJobs).to.have.length(1);
    expect(matchingJobs[0]).to.include({
      id: "job-3",
      action: "system-update",
      status: "in_progress",
      progress: 25,
      summaryMessage: "Applying upgrade",
    });
  });
});
