import { LitElement, html, css } from '/vendor/@lit/all@3.1.2/lit-all.min.js';
import { StoreSubscriber } from '/state/subscribe.js';
import { store } from '/state/store.js';
import debounce from '/utils/debounce.js';

class IframeView extends LitElement {
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
      height: 100vh;
      box-sizing: border-box;
      position: relative;
    }

    #IframeContainer iframe {
      width: 100%;
      height: 100%;
    }
  `;

  // Whenever pupContext source is available, set ready to true.
  updated(changedProperties) {
    super.updated(changedProperties);
    if (changedProperties.has('pupContext')) {
      this.ready = !!this.context.store.pupContext.manifest.gui.source;
      this.requestUpdate();
    }
  }

  constructor() {
    super();

    // Subscribe to changes of pupContext
    this.context = new StoreSubscriber(this, store)

    // Ready state is dependent on the pupContext having an iframe source.
    this.ready = !!this.context.store.pupContext.manifest.gui.source

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
      
      this.iframeElement = this.shadowRoot.querySelector('iframe');
    
      // TODO: perform action on iframe load.
      // this.iframeElement.addEventListener('load', this.handleIframeLoad);
      
      // track host container size changes
      const hostContainer = this.shadowRoot.getElementById('IframeContainer');
      this.resizeObserver.observe(hostContainer);

      // subscribe to path change messages from child.
      window.addEventListener("message", this.handleMessage.bind(this));

    });
  }

  handleMessage(event) {
    // TODO: switch on event type
    // TODO: not this.
    const { pupContext } = this.context.store
    const newUrl = `${pupContext.manifest.path}/${event.data.path}`.replace('//','/')
    this.updateBrowserURL(newUrl, '', '', false);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.resizeObserver.disconnect();
    window.removeEventListener("message", this.handleMessage)
  }

  // The actual resize handler that sends the message to the iframe
  handleResize = (contentRect) => {
    const width = contentRect.width;
    const height = contentRect.height;
    if (this.iframeElement && this.iframeElement.contentWindow) {
      // TODO: Replace '*' with the actual origin of the iframe for security
      const targetOrigin = new URL(this.iframeElement.src).origin;
      this.iframeElement.contentWindow.postMessage({ width, height }, targetOrigin);
    }
  }

  updateBrowserURL(pathname, search = '', hash = '', replace = false) {
    if (window.location.pathname !== pathname ||
        window.location.search !== search ||
        window.location.hash !== hash) {
      const changeState = replace ? 'replaceState' : 'pushState';
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
          <iframe src="${pupContext.manifest.gui.source}" style="opacity: 0.1" frameBorder="0"></iframe>
        </div>
      `;
    }
  }
}

customElements.define('iframe-view', IframeView);

