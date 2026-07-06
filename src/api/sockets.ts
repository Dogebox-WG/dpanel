import { ReactiveClass } from "/utils/class-reactive.js";
import { store } from "/state/store.js";
import type { NetworkContext } from "/state/store.js";
import { StoreSubscriber } from "/state/subscribe.js";

export interface SocketMessageEvent {
  data: string;
}

/**
 * A mock event generator drives onMessage with synthetic events; it may
 * return a stop function to halt mocking on disconnect.
 */
export type MockEventGenerator = (
  onMessageCallback: (event: SocketMessageEvent) => void,
) => void | (() => void) | Promise<void>;

export default class WebSocketClient extends ReactiveClass {
  context: StoreSubscriber;
  networkContext: NetworkContext;
  url: string;
  useMocks: boolean | undefined;
  token: string | false | null;
  mockEventGenerator: MockEventGenerator | undefined;
  stopMocking: () => void;
  socket: WebSocket | null;
  _isConnected: boolean;
  _isConnecting: boolean;

  constructor(
    url: string,
    networkContext: NetworkContext,
    mockEventGenerator?: MockEventGenerator,
  ) {
    super();

    this.context = new StoreSubscriber(this, store);
    this.networkContext = this.context.store.networkContext;

    this.url = url;
    this.useMocks = networkContext?.useMocks;
    this.token = this.networkContext.token;
    this.mockEventGenerator = mockEventGenerator;
    this.stopMocking = () => console.log("Stop function not provided.");
    this.socket = null;
    this._isConnected = false;
    this._isConnecting = false;
  }

  requestUpdate(): void {
    super.requestUpdate();
    this.networkContext = this.context.store.networkContext;
  }

  connect(): void {
    if (
      this._isConnected ||
      this._isConnecting
    ) {
      console.log("Connection or mock is already running.");
      return;
    }
    this._isConnecting = true;
    if (this.useMocks && this.mockEventGenerator) {
      this.startMocking();
    } else {
      this.startWebSocketConnection();
    }
    this._isConnecting = false;
  }

  startWebSocketConnection(): void {
    // Preserve any existing query params, then append the auth token.
    const socketUrl = new URL(this.url);
    if (this.token) {
      socketUrl.searchParams.set("token", this.token);
    }
    this.socket = new WebSocket(socketUrl.toString());
    this.socket.onopen = () => {
      this._isConnected = true;
      this.onOpen();
    };
    this.socket.onmessage = this.onMessage.bind(this);
    this.socket.onerror = (error) => {
      this.onError(error);
    };
    this.socket.onclose = () => {
      this._isConnected = false;
      this.onClose();
    };
  }

  startMocking(): void {
    if (this._isConnected) {
      console.log("Mock is already running.");
      return;
    }
    // Only async generators without a stop function return promises; keep the
    // no-op stopMocking default in that case.
    const maybeStop = this.mockEventGenerator!(this.onMessage.bind(this));
    if (typeof maybeStop === "function") {
      this.stopMocking = maybeStop;
    }
    this._isConnected = true;
    this.onOpen(); // Simulate open event for mocks
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.close();
    }
    if (this.useMocks) {
      this.stopMocking();
      this._isConnected = false;
      this.onClose(); // Simulate close event for mocks
    }
  }

  get isConnected(): boolean {
    return this._isConnected;
  }

  onOpen(): void {
    console.log("WebSocket connection or mock started");
  }

  onMessage(message: SocketMessageEvent): void | Promise<void> {
    console.log("Message received:", message.data);
  }

  onError(error: unknown): void {
    console.error("WebSocket encountered an error:", error);
  }

  onClose(event?: unknown): void {
    console.log("WebSocket connection or mock stopped");
  }
}
