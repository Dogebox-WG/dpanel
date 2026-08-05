import { html, fixture, expect } from "../../../dev/node_modules/@open-wc/testing";

import { store } from "/state/store.js";
import { jobWebSocket } from "/controllers/sockets/job-channel.js";

import "./action-setup-progress/index.js";

describe("SetupProgress", () => {
  beforeEach(() => {
    store.updateState({
      networkContext: {
        ...store.networkContext,
        useMocks: true,
      },
      jobsContext: {
        jobs: [
          {
            id: "job-setup-1",
            displayName: "Setup Dogebox",
            status: "orphaned",
            progress: 25,
            summaryMessage: "Job marked as orphaned",
            errorMessage: "Job is no longer being processed",
            started: new Date().toISOString(),
            finished: new Date().toISOString(),
          },
        ],
        loading: false,
        error: null,
      },
    });
  });

  afterEach(() => {
    jobWebSocket.disconnect();
    store.updateState({
      jobsContext: {
        jobs: [],
        loading: false,
        error: null,
      },
    });
  });

  it("treats orphaned jobs as failed setup outcomes", async () => {
    const el = await fixture(
      html`<x-action-setup-progress .jobId=${"job-setup-1"}></x-action-setup-progress>`
    );

    await el.updateComplete;

    expect(el._failed).to.equal(true);
    expect(el._completionHandled).to.equal(true);
    expect(el.shadowRoot.querySelector(".error-bar")).to.exist;
    expect(el.shadowRoot.textContent).to.contain("Job is no longer being processed");
  });
});
