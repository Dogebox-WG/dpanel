import {
  html,
  fixture,
  expect,
  waitUntil,
} from "../../../dev/node_modules/@open-wc/testing";

import { store } from "/state/store.js";

import "./action-check-updates/index.js";

describe("CheckUpdatesView", () => {
  let originalNetworkContext;

  beforeEach(() => {
    originalNetworkContext = { ...store.networkContext };
    store.updateState({
      networkContext: {
        useMocks: true,
        forceFailures: true,
        "mock::updates::/system/updates::get": true,
      },
    });
  });

  afterEach(() => {
    store.updateState({ networkContext: originalNetworkContext });
  });

  it("shows a retryable failure and recovers when checking again", async () => {
    const el = await fixture(
      html`<x-action-check-updates></x-action-check-updates>`,
    );

    await waitUntil(
      () => !el._inflight_checking && el._check_error,
      "update check did not enter its failure state",
    );
    await el.updateComplete;

    const failureAlert = el.shadowRoot.querySelector('sl-alert[variant="danger"]');
    const retryButton = [...el.shadowRoot.querySelectorAll("sl-button")]
      .find((button) => button.textContent.trim() === "Check again");

    expect(failureAlert).to.exist;
    expect(failureAlert.textContent).to.contain("Check failed");
    expect(el.shadowRoot.textContent).to.contain(
      "Unable to check for updates: Simulated error returned from /system/updates",
    );
    expect(retryButton).to.exist;
    expect(retryButton.hasAttribute("disabled")).to.equal(false);

    store.updateState({ networkContext: { forceFailures: false } });
    retryButton.click();

    await waitUntil(
      () => !el._inflight_checking && el._has_updates,
      "update check did not recover after retrying",
      { timeout: 2000 },
    );
    await el.updateComplete;

    expect(el._check_error).to.equal(null);
    expect(el.shadowRoot.textContent).to.contain("Update available");
    expect(el.shadowRoot.querySelector('sl-alert[variant="danger"]')).not.to.exist;
  });
});
