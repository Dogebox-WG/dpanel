import { LitElement, html, css } from '/vendor/@lit/all@3.1.2/lit-all.min.js';
import { store } from '/state/store.js';
import WebSocketClient from '/api/sockets.js';
import { mockedLogRunner } from './log.mocks.js';

class LogViewer extends LitElement {
  static get properties() {
    return {
      autostart: { type: Boolean },
      logs: { type: Array },
      isConnected: { type: Boolean },
      follow: { type: Boolean },
      pupId: { type: String },
    };
  }

  constructor() {
    super();
    this.logs = [];
    this.pupId = store.pupContext.manifest.package;
    this.isConnected = false;
    this.wsClient = null;
    this.follow = true;
    this.autostart = true;
  }

  connectedCallback() {
    super.connectedCallback();
    this.setupSocketConnection()
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    console.log('Disconnecting log-viewer socket connection');
    // Clean up WebSocket connection
    this.wsClient.disconnect();
  }

  updated(changedProperties) {
    if (changedProperties.has('autostart') && this.autostart) {
      this.wsClient && this.wsClient.connect();
    }
  }

  firstUpdated() {
  const logContainer = this.shadowRoot.querySelector('#LogContainer');
    logContainer.addEventListener('scroll', () => {
      // Check if the user has scrolled up from the bottom
      if (logContainer.scrollTop < logContainer.scrollHeight - logContainer.clientHeight) {
        this.follow = false;
      }
    });
  }

  handleFollowChange(e) {
    this.follow = e.target.checked;
    if (this.follow) {
      const logContainer = this.shadowRoot.querySelector('#LogContainer');
      logContainer.scrollTop = logContainer.scrollHeight;
    }
  }

  handleToggleConnection() {
    if (this.wsClient.isConnected) {
      this.wsClient.disconnect();
    } else {
      this.wsClient.connect();
    }
  }

  setupSocketConnection() {
    if (this.isConnected) {
      return;
    }

    if (!this.pupId) {
      return;
    }

    this.wsClient = new WebSocketClient(
      `ws://localhost:3000/logs/${this.pupId}`,
      store.networkContext,
      mockedLogRunner
    );
    
    // Update component state based on WebSocket events
    this.wsClient.onOpen = (event) => {
      this.isConnected = true;
      this.requestUpdate();
    };

    this.wsClient.onMessage = async (event) => {
      this.logs = [...this.logs, event.data];
      await this.requestUpdate();
      if (this.follow) {
        const logContainer = this.shadowRoot.querySelector('#LogContainer');
        logContainer.scrollTop = logContainer.scrollHeight;
      }
    };

    this.wsClient.onError = (event) => {
      this.isConnected = false;
      this.requestUpdate();
    };

    this.wsClient.onClose = (event) => {
      this.isConnected = false;
      this.requestUpdate();
    };

    if (this.autostart) {
      this.wsClient.connect();
    }
  }

  handleDownloadClick() {
    const contentDiv = this.shadowRoot.querySelector("#LogContainer");
    
    let textToDownload = '';

    // Extracting text from each <li> and adding a newline after each
    contentDiv.querySelectorAll('li').forEach(li => {
      textToDownload += li.textContent + '\n';
    });

    // Creating a Blob for the text
    const blob = new Blob([textToDownload], { type: 'text/plain' });

    // Creating an anchor element to trigger download
    const a = document.createElement('a');
    a.setAttribute('no-intercept', true)
    a.href = URL.createObjectURL(blob);
    a.download = `log_${this.pupId}_${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();

    // Cleanup the temporary element
    document.body.removeChild(a);

  }

  render() {
    return html`
      <div>
        <div id="LogHUD">
          <div class="status">
            ${this.isConnected
              ? html`<sl-tag size="small" pill @click=${this.handleToggleConnection} variant="success">Connected</sl-tag>`
              : html`<sl-tag size="small" pill @click=${this.handleToggleConnection} variant="neutral">Disconnected</sl-tag>`
            }
          </div>
        </div>
        <div id="LogContainer">
          <ul>
            ${this.logs.map(log => html`<li>${log}</li>`)}
          </ul>
        </div>
        <div id="LogFooter">
          <div class="options">
            <sl-checkbox
              size="medium"
              ?checked=${this.follow}
              @sl-change=${this.handleFollowChange}
            >Auto scroll</sl-checkbox>
          </div>
          <sl-button 
            variant="text"
            size="large"
            target="_blank"
            @click=${this.handleDownloadClick}
            >Download
            <sl-icon name="download" slot="suffix"></sl-icon>
          </sl-button>
        </div>
      </div>
    `;
  }

  static get styles() {
    return css`
      :host {
        --log-footer-height: 80px;
        --page-header-height: 80px;
        display: block;
        position: relative;
      }
      div#LogHUD {
        position: absolute;
        right: 16px;
        top: 8px;

        display: flex;
        flex-direction: column;
        align-items: end;
      }
      div#LogHUD .status {
        opacity: 0.3;
        cursor: pointer;
      }
      div#LogHUD div {
        opacity: 0.2;
        transition: opacity 250ms ease-out;
      }
      div#LogHUD div:hover {
        opacity: 1;
      }
      div#LogContainer {
        background: #0b0b0b;
        padding: 0.5em;
        height: calc(100vh - (var(--log-footer-height) + var(--page-header-height)));
        overflow-y: scroll;
        overflow-x: hidden;
        box-sizing: border-box;
      }

      div#LogFooter {
        display: block;
        height: var(--log-footer-height);
        background: rgb(24, 24, 24);
        width: 100%;
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
        padding: 0em 1.5em;
        box-sizing: border-box;
      }
      ul {
        list-style-type: none;
        padding: 0;
        margin: 0px;
      }
      li {
        font-family: 'Courier New', monospace;
        font-size: 0.85rem;
        line-height: 1.1;
        font-weight: bold;
        margin: 0px 0;
        padding: 0px;
      }
    `;
  }
}

customElements.define('x-log-viewer', LogViewer);