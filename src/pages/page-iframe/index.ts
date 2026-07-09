import { LitElement, html, css } from '/lib/lit-all.js';
import { StoreSubscriber } from '/state/subscribe.js';
import { store } from '/state/store.js';
import debounce from '/utils/debounce.js';

/**
 * Legacy manifest shape read by this page (manifest.gui.source predates the
 * current PupContext model; kept as-is pending an iframe page rework).
 */
interface IframeManifest {
  path?: string;
  gui?: { source?: string };
}

class IframeView extends LitElement {
  ready: boolean;
  context: StoreSubscriber;
  iframeElement: HTMLIFrameElement | null;
  debouncedHandleResize: (contentRect: DOMRectReadOnly) => void;
  resizeObserver: ResizeObserver;

  static styles = css`
    #LoaderContainer {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 400px;
      height: 20px;
    }

    #IframeContainer {
      width: 100%;
      height: calc(100vh - 80px);
      box-sizing: border-box;
      position: relative;
    }

    #IframeContainer iframe {
      width: 100%;
      height: 100%;
    }
  `;

  // Whenever pupContext source is available, set ready to true.
  updated(changedProperties: Map<PropertyKey, unknown>) {
    super.updated(changedProperties);
    if (changedProperties.has('pupContext')) {
      this.ready = !!this.getIframeManifest()?.gui?.source;
      this.requestUpdate();
    }
  }

  getIframeManifest(): IframeManifest | undefined {
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    return (this.context.store.pupContext as { manifest?: IframeManifest }).manifest;
  }

  constructor() {
    super();

    // Subscribe to changes of pupContext
    this.context = new StoreSubscriber(this, store)

    // Ready state is dependent on the pupContext having an iframe source.
    this.ready = !!this.getIframeManifest()?.gui?.source

    this.iframeElement = null;
    this.debouncedHandleResize = debounce(this.handleResize, 300);
    
    // estrablish a resize observer, run a function limited to once every 300ms.
    this.resizeObserver = new ResizeObserver(entries => {
      for (let entry of entries) {
        this.debouncedHandleResize(entry.contentRect);
      }
    });
  }

  connectedCallback() {
    super.connectedCallback();
    this.updateComplete.then(() => {
      if (!this.ready) return
      
      this.iframeElement = this.shadowRoot!.querySelector('iframe');
    
      // TODO: perform action on iframe load.
      // this.iframeElement.addEventListener('load', this.handleIframeLoad);
      
      // track host container size changes
      const hostContainer = this.shadowRoot!.getElementById('IframeContainer');
      if (hostContainer) this.resizeObserver.observe(hostContainer);

      // subscribe to path change messages from child.
      window.addEventListener("message", this.handleMessage.bind(this));

    });
  }

  handleMessage(event: MessageEvent<{ path?: string }>) {
    // TODO: switch on event type
    // TODO: not this.
    const newUrl = `${this.getIframeManifest()?.path}/${event.data.path}`.replace('//','/')
    this.updateBrowserURL(newUrl, '', '', false);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.resizeObserver.disconnect();
    window.removeEventListener("message", this.handleMessage)
  }

  // The actual resize handler that sends the message to the iframe
  handleResize = (contentRect: DOMRectReadOnly) => {
    const width = contentRect.width;
    const height = contentRect.height;
    if (this.iframeElement && this.iframeElement.contentWindow) {
      // TODO: Replace '*' with the actual origin of the iframe for security
      const targetOrigin = new URL(this.iframeElement.src).origin;
      this.iframeElement.contentWindow.postMessage({ width, height }, targetOrigin);
    }
  }

  updateBrowserURL(pathname: string, search = '', hash = '', replace = false) {
    if (window.location.pathname !== pathname ||
        window.location.search !== search ||
        window.location.hash !== hash) {
      const changeState = replace ? 'replaceState' as const : 'pushState' as const;
      // Update the URL
      window.history[changeState](null, document.title, pathname + search + hash);
      // Dispatch a custom popstate event with a state that tells the router to ignore this change
      window.dispatchEvent(new PopStateEvent('popstate', { state: 'vaadin-router-ignore' }));
    }
  }

  render() {
    const { pupContext } = this.context.store
    if (!this.ready) {
      return html`
        <div id="IframeContainer">
          <div id="LoaderContainer">
            <sl-progress-bar indeterminate></sl-progress-bar>
          </div>
        </div>
      `
    }

    if (this.ready) {
      return html`

        <div id="IframeContainer">
          <iframe src="${this.getIframeManifest()?.gui?.source}" frameBorder="0"></iframe>
        </div>
      `;
    }
  }
}

customElements.define('x-page-pup-iframe', IframeView);

