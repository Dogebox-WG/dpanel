import type { ReactiveController, ReactiveControllerHost } from 'lit';

export interface StoreInterface {
  subscribe(controller: StoreSubscriber): void;
  [key: string]: any;
}

export class StoreSubscriber implements ReactiveController {
  host: ReactiveControllerHost;
  store: StoreInterface;

  constructor(host: ReactiveControllerHost, store: StoreInterface);

  hostConnected?(): void;
  hostDisconnected?(): void;

  stateChanged(): void;
}

