import { expect } from "../../dev/node_modules/@open-wc/testing";
import { spy, stub } from "../../dev/node_modules/sinon";
import { store } from "/state/store.js";
import { performLogout } from "./middleware.js";

describe("performLogout", () => {
  let fetchStub;

  beforeEach(() => {
    store.updateState({ networkContext: { token: "logout-test-token" } });
    fetchStub = stub(window, "fetch").resolves(new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    ));
  });

  afterEach(() => fetchStub.restore());

  it("invalidates the server session before clearing the local token", async () => {
    const redirect = spy(() => "/login");

    await performLogout({}, { redirect });

    expect(fetchStub.calledOnce).to.equal(true);
    expect(fetchStub.firstCall.args[0]).to.match(/\/logout$/);
    expect(fetchStub.firstCall.args[1].method).to.equal("POST");
    expect(fetchStub.firstCall.args[1].headers.Authorization).to.equal(
      "Bearer logout-test-token",
    );
    expect(store.networkContext.token).to.equal(null);
    expect(redirect.calledOnceWith("/login")).to.equal(true);
  });

  it("still clears the local token when server invalidation fails", async () => {
    fetchStub.rejects(new Error("offline"));
    const redirect = spy(() => "/login");

    await performLogout({}, { redirect });

    expect(store.networkContext.token).to.equal(null);
    expect(redirect.calledOnceWith("/login")).to.equal(true);
  });

  it("does not repeat logout when the server session is already invalid", async () => {
    fetchStub.resolves(new Response(
      JSON.stringify({ success: false }),
      { status: 401, headers: { "Content-Type": "application/json" } },
    ));
    const redirect = spy(() => "/login");

    await performLogout({}, { redirect });

    expect(fetchStub.calledOnce).to.equal(true);
    expect(store.networkContext.token).to.equal(null);
    expect(redirect.calledOnceWith("/login")).to.equal(true);
  });
});
