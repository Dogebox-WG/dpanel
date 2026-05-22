import { expect } from "../../../../dev/node_modules/@open-wc/testing";

import { canCopyToClipboard } from "/utils/clipboard.js";

describe("canCopyToClipboard", () => {
  it("returns true in a secure context with clipboard support", () => {
    const fakeWindow = {
      isSecureContext: true,
      navigator: {
        clipboard: {
          writeText() {},
        },
      },
    };

    expect(canCopyToClipboard(fakeWindow)).to.equal(true);
  });

  it("returns false outside a secure context", () => {
    const fakeWindow = {
      isSecureContext: false,
      navigator: {
        clipboard: {
          writeText() {},
        },
      },
    };

    expect(canCopyToClipboard(fakeWindow)).to.equal(false);
  });

  it("returns false when the clipboard API is unavailable", () => {
    const fakeWindow = {
      isSecureContext: true,
      navigator: {},
    };

    expect(canCopyToClipboard(fakeWindow)).to.equal(false);
  });
});
