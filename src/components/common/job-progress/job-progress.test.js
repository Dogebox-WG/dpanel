import { html, fixture, expect } from "../../../../dev/node_modules/@open-wc/testing";

import "./index.js";

describe("JobProgress", () => {
  it("shows delete for queued jobs", async () => {
    const job = {
      id: "job-1",
      displayName: "Queued Job",
      status: "queued",
      progress: 0,
      summaryMessage: "Queued",
      errorMessage: null,
      started: new Date().toISOString(),
      finished: null,
    };

    const el = await fixture(html`<job-progress .job=${job}></job-progress>`);

    const deleteButton = el.shadowRoot.querySelector('sl-icon-button[label="Delete job"]');

    expect(deleteButton).to.exist;

    const deleteEventPromise = new Promise((resolve) => {
      el.addEventListener("job-delete", resolve, { once: true });
    });
    deleteButton.click();
    const deleteEvent = await deleteEventPromise;
    expect(deleteEvent.detail.job).to.equal(job);
  });

  it("does not show actions for non-queued jobs", async () => {
    const jobs = [
      {
        id: "job-2",
        displayName: "Failed Job",
        status: "failed",
        progress: 80,
        summaryMessage: "Failed",
        errorMessage: "Boom",
        started: new Date().toISOString(),
        finished: new Date().toISOString(),
      },
      {
        id: "job-3",
        displayName: "Orphaned Job",
        status: "orphaned",
        progress: 40,
        summaryMessage: "Job marked as orphaned",
        errorMessage: "Job is no longer being processed",
        started: new Date().toISOString(),
        finished: new Date().toISOString(),
      },
      {
        id: "job-4",
        displayName: "Cancelled Job",
        status: "cancelled",
        progress: 80,
        summaryMessage: "Cancelled by user",
        errorMessage: null,
        started: new Date().toISOString(),
        finished: new Date().toISOString(),
      },
    ];

    for (const job of jobs) {
      const el = await fixture(html`<job-progress .job=${job}></job-progress>`);

      const deleteButton = el.shadowRoot.querySelector('sl-icon-button[label="Delete job"]');

      expect(deleteButton).to.not.exist;
    }
  });
});
