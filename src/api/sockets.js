import { ReactiveClass } from "/utils/class-reactive.js";
import { store } from "/state/store.js";
import { StoreSubscriber } from "/state/subscribe.js";

export default class WebSocketClient extends ReactiveClass {
  constructor(url, networkContext, mockEventGenerator) {
    super();

    this.context = new StoreSubscriber(this, store);
    this.networkContext = this.context.store.networkContext;

    this.url = url;
    this.useMocks = networkContext?.useMocks;
    this.token = this.networkContext.token
    this.mockEventGenerator = mockEventGenerator;
    this.stopMocking = () => console.log('Stop function not provided.');
    this.socket = null;
    this._isConnected = false;
  }

  requestUpdate() {
    super.requestUpdate();
    this.networkContext = this.context.store.networkContext;
  }

  connect() {
    if (this._isConnected) {
      console.log('Connection or mock is already running.');
      return;
    }
    if (this.useMocks && this.mockEventGenerator) {
      this.startMocking();
    } else {
      this.startWebSocketConnection();
    }
  }

  startWebSocketConnection() {
    const urlWithAuth = this.url + `?token=${this.token}`
    this.socket = new WebSocket(urlWithAuth);
    this.socket.onopen = () => {
      this._isConnected = true;
      this.onOpen();
    };
    this.socket.onmessage = this.onMessage.bind(this);
    this.socket.onerror = this.onError.bind(this);
    this.socket.onclose = () => {
      this._isConnected = false;
      this.onClose();
    };
  }

  startMocking() {
    if (this._isConnected) {
      console.log('Mock is already running.');
      return;
    }
    this.stopMocking = this.mockEventGenerator(this.onMessage.bind(this));
    this._isConnected = true;
    this.onOpen();  // Simulate open event for mocks
  }

  disconnect() {
    if (this.socket) {
      this.socket.close();
    }
    if (this.useMocks) {
      this.stopMocking();
      this._isConnected = false;
      this.onClose();  // Simulate close event for mocks
    }
  }

  get isConnected() {
    return this._isConnected;
  }

  onOpen() {
    console.log('WebSocket connection or mock started');
  }

  onMessage(message) {
    console.log('Message received:', message.data);
  }

  onError(error) {
    console.error('WebSocket encountered an error:', error);
  }

  onClose() {
    console.log('WebSocket connection or mock stopped');
  }
}