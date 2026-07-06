// Type bridge for sockets.js until the api modules migrate to TypeScript in
// Phase 4.
import type { NetworkContext } from "/state/store.js";

export interface SocketMessageEvent {
  data: string;
}

export type MockEventGenerator = (
  onMessageCallback: (event: SocketMessageEvent) => void,
) => void | Promise<void>;

export default class WebSocketClient {
  constructor(
    url: string,
    networkContext: NetworkContext,
    mockEventGenerator?: MockEventGenerator,
  );

  url: string;
  socket: WebSocket | null;

  // Assignable event handlers.
  onOpen: () => void;
  onMessage: (event: SocketMessageEvent) => void | Promise<void>;
  onError: (event: unknown) => void;
  onClose: (event?: unknown) => void;

  connect(): void;
}
