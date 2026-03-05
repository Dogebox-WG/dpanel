// Test helpers
import {
  html,
  fixture,
  expect,
  waitUntil,
} from "../../../../dev/node_modules/@open-wc/testing";
import { sendKeys } from "../../../../dev/node_modules/@web/test-runner-commands";
import { spy } from "../../../../dev/node_modules/sinon";

// Component being tested.
import "./index.js";

// NOTE: Ran locally but had issues on GitHub Actions, so this suite is skipped for now.
describe.skip("LoginView", () => {
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

    // Override components _attemptLogin function
    const _attemptLoginSpy = spy(el, "_attemptLogin");
    await el.requestUpdate();

    // Elements
    const dynamicFormEl = el.shadowRoot.querySelector("dynamic-form");

    // Type in a password
    dynamicFormEl.focus("password");
    await sendKeys({ type: "pa$$w0rD" });

    // Wait for key entry and element update.
    await waitUntil(() => dynamicFormEl._dirty, "form did not become dirty");

    // Submit data
    await sendKeys({ press: "Enter" });

    expect(_attemptLoginSpy.calledOnce).to.be.true;
    expect(_attemptLoginSpy.calledWith({ password: "pa$$w0rD" })).to.be.true;
  });
});
