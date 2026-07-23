import type { ReactiveController, ReactiveControllerHost } from "lit";
import type { Store } from "./store.js";

export class StoreSubscriber implements ReactiveController {
  host: ReactiveControllerHost;
  store: Store;

  // Optional ReactiveController lifecycle hooks; declared (without runtime
  // implementations) so the class is structurally assignable to
  // ReactiveController.
  hostConnected?(): void;
  hostDisconnected?(): void;

  constructor(host: ReactiveControllerHost, store: Store) {
    (this.host = host).addController(this);
    this.store = store;

    // Subscribe to store updates
    this.store.subscribe(this);
  }

  stateChanged() {
    this.host.requestUpdate();
  }
}
