import { expect } from "../../dev/node_modules/@open-wc/testing";

import {
  closePupDialog,
  handlePupDialogAfterHide,
  handlePupDialogHide,
  openPupDialog,
  showPupDialog,
} from "/pages/pup-dialog-lifecycle.js";

function createState() {
  return {
    dialog_open: false,
    open_dialog: "",
    open_dialog_label: "",
  };
}

describe("pup listing dialog lifecycle", () => {
  it("opens the requested dialog view", () => {
    const state = createState();
    const action = document.createElement("button");
    action.setAttribute("name", "readme");
    action.setAttribute("label", "Read me");

    openPupDialog(state, action);

    expect(state.dialog_open).to.be.true;
    expect(state.open_dialog).to.equal("readme");
    expect(state.open_dialog_label).to.equal("Read me");
  });

  it("opens a dialog from a programmatic action", () => {
    const state = createState();

    showPupDialog(state, "configure", "Configure");

    expect(state.dialog_open).to.be.true;
    expect(state.open_dialog).to.equal("configure");
    expect(state.open_dialog_label).to.equal("Configure");
  });

  it("retains dialog content until the closing animation completes", () => {
    const state = {
      dialog_open: true,
      open_dialog: "deps",
      open_dialog_label: "Dependencies",
    };
    const dialog = {};
    const dialogEvent = { target: dialog, currentTarget: dialog };

    handlePupDialogHide(state, dialogEvent);

    expect(state.dialog_open).to.be.false;
    expect(state.open_dialog).to.equal("deps");
    expect(state.open_dialog_label).to.equal("Dependencies");

    handlePupDialogAfterHide(state, dialogEvent);

    expect(state.open_dialog).to.equal("");
    expect(state.open_dialog_label).to.equal("");
  });

  it("ignores dialog lifecycle events from nested controls", () => {
    const state = {
      dialog_open: true,
      open_dialog: "ints",
      open_dialog_label: "Interfaces",
    };
    const nestedEvent = {
      target: {},
      currentTarget: {},
    };

    handlePupDialogHide(state, nestedEvent);
    handlePupDialogAfterHide(state, nestedEvent);

    expect(state.dialog_open).to.be.true;
    expect(state.open_dialog).to.equal("ints");
    expect(state.open_dialog_label).to.equal("Interfaces");
  });

  it("preserves the selected view when closed programmatically", () => {
    const state = {
      dialog_open: true,
      open_dialog: "update",
      open_dialog_label: "Update",
    };

    closePupDialog(state);

    expect(state.dialog_open).to.be.false;
    expect(state.open_dialog).to.equal("update");
    expect(state.open_dialog_label).to.equal("Update");
  });
});
