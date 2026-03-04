// Test helpers
import {
  html,
  fixture,
  expect,
  waitUntil,
  elementUpdated,
} from "../../../../dev/node_modules/@open-wc/testing";
import { stub } from "../../../../dev/node_modules/sinon";

// Component being tested.
import "./index.js";

describe("LoginView", () => {
  it("presents a login field and button", async () => {
    // Initialise the component
    const el = await fixture(html`<x-action-login></x-action-login>`);

    // Heading
    const heading = el.shadowRoot.querySelector("h1");
    expect(heading.textContent).to.equal("Such Login!");

    // DynamicForm
    const dynamicForm = el.shadowRoot.querySelector("dynamic-form");
    expect(dynamicForm).to.exist;

    // DynamicForm contents
    const inputs = dynamicForm.shadowRoot.querySelectorAll("sl-input");
    expect(inputs.length).to.equal(1);

    const buttons = dynamicForm.shadowRoot.querySelectorAll("sl-button");
    expect(buttons.length).to.equal(1);
  });

  it("_attemtpLogin is called on form submit with typed password as first arg", async () => {
    // Initialise the component
    const el = await fixture(html`<x-action-login></x-action-login>`);

    // Stub network path from _attemptLogin to keep test deterministic.
    const _attemptLoginStub = stub(el, "_attemptLogin").resolves();
    await el.requestUpdate();

    // Elements
    const dynamicFormEl = el.shadowRoot.querySelector("dynamic-form");

    // Set password via component API to avoid CI keyboard-focus flakiness.
    dynamicFormEl.setValue("password", "pa$$w0rD");
    await elementUpdated(dynamicFormEl);

    // Wait for value entry and element update.
    await waitUntil(() => dynamicFormEl._dirty, "form did not become dirty");

    // Submit data
    const form = dynamicFormEl.shadowRoot.querySelector("form");
    form.requestSubmit();

    await elementUpdated(dynamicFormEl);

    expect(_attemptLoginStub.calledOnce).to.be.true;
    expect(_attemptLoginStub.calledWith({ password: "pa$$w0rD" })).to.be.true;

    _attemptLoginStub.restore();
  });
});
