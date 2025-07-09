// Test helpers
import {
  html,
  fixture,
  expect,
  waitUntil,
  elementUpdated,
  aTimeout,
} from "../../../../../dev/node_modules/@open-wc/testing";
import { sendKeys } from "../../../../../dev/node_modules/@web/test-runner-commands";
import { repeatKeys } from "../../../../../dev/utils/keyboard.js";

// Component being tested.
import "../dynamic-form.js";

describe("A select field, with options", async () => {
  const fields = {
    sections: [
      {
        name: "section-foo",
        fields: [
          {
            name: "colour",
            label: "Favourite Colour",
            type: "select",
            options: [
              { value: "#FF0000", label: "Red" },
              { value: "#0000FF", label: "Blue" },
              { value: "#00FF00", label: "Green" },
            ],
          },
        ],
      },
    ],
  };

  it("renders all options with accurate label", async () => {
    // Initialise the component
    const el = await fixture(html`
      <dynamic-form .fields=${fields}></dynamic-form>
    `);

    // Wait until fields are initialized
    await waitUntil(() => el.fields, "Fields did not become ready");

    // Target form
    const options = el.shadowRoot.querySelectorAll("sl-option");

    expect(options.length).to.equal(3);
    expect(options[0].textContent).to.equal("Red");
    expect(options[1].textContent).to.equal("Blue");
    expect(options[2].textContent).to.equal("Green");
  });

  it("on change, the selected option's value is accurate", async () => {
    const values = {
      colour: "#FF0000",
    };

    // Initialise the component
    const el = await fixture(html`
      <dynamic-form .fields=${fields} .values=${values}></dynamic-form>
    `);

    // Wait until fields are initialized
    await waitUntil(() => el.fields, "Fields did not become ready");

    // Target form
    const options = el.shadowRoot.querySelectorAll("sl-option");

    el.focus("colour");

    // With the sl-input now in focus, select the second option of the dropdown
    await sendKeys({ press: "ArrowDown" });
    await sendKeys({ press: "ArrowDown" });
    await sendKeys({ press: "Enter" });

    expect(el._colour).to.equal("#FF0000");
  });
});

describe("Methods: getState, getFormValues", async () => {
  const fields = {
    sections: [
      {
        name: "section-foo",
        fields: [
          {
            name: "flavour",
            label: "Flavour",
            type: "text",
          },
          {
            name: "colour",
            label: "Favourite Colour",
            type: "select",
            options: [
              { value: "#FF0000", label: "Red", primary: true },
              { value: "#0000FF", label: "Blue", primary: true },
              { value: "#00FF00", label: "Green", primary: false },
              { value: "#FFFF00", label: "Yellow", primary: true },
            ],
          },
        ],
      },
    ],
  };

  it("getFormValues returns simple key/val pairs", async () => {
    // Initialise the component
    const el = await fixture(html`
      <dynamic-form .fields=${fields}></dynamic-form>
    `);

    // Wait until fields are initialized
    await waitUntil(() => el.fields, "Fields did not become ready");

    // Target form
    const options = el.shadowRoot.querySelectorAll("sl-option");

    el.focus("colour");

    // With the sl-input now in focus, select the second option of the dropdown
    await sendKeys({ press: "ArrowDown" });
    await sendKeys({ press: "ArrowDown" });
    await sendKeys({ press: "Enter" });

    await waitUntil(() => el._colour, "color did not update");

    el.focus("flavour");
    await sendKeys({ type: "A" });

    await waitUntil(() => el._flavour === "A", "flavour did not update");

    const expectedValues = {
      colour: "#0000FF",
      flavour: "A",
    };

    expect(el.getFormValues()).to.deep.equal(expectedValues);
  });

  it("getState returns key/val pairs WITH selected objects", async () => {
    // Initialise the component
    const el = await fixture(html`
      <dynamic-form .fields=${fields}></dynamic-form>
    `);

    // Wait until fields are initialized
    await waitUntil(() => el.fields, "Fields did not become ready");

    // Target form
    const options = el.shadowRoot.querySelectorAll("sl-option");

    el.focus("colour");

    // With the sl-input now in focus, select the second option of the dropdown
    await sendKeys({ press: "ArrowDown" });
    await sendKeys({ press: "ArrowDown" });
    await sendKeys({ press: "Enter" });

    await waitUntil(() => el._colour, "color did not update");

    el.focus("flavour");
    await sendKeys({ type: "A" });

    await waitUntil(() => el._flavour === "A", "flavour did not update");

    const expectedState = {
      colour: {
        label: "Blue",
        primary: true,
        value: "#0000FF",
      },
      flavour: "A",
    };

    expect(el.getState()).to.deep.equal(expectedState);
  });
});
