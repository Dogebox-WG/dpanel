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
      jobId: { type: String },
    };
  }

  constructor() {
    super();
    this.logs = [];
    this.pupId = "";
    this.jobId = "";
    this.isConnected = false;
    this.wsClient = null;
    // Load saved auto-scroll preference, default to true
    const savedFollow = localStorage.getItem('log-viewer-autoscroll');
    this.follow = savedFollow !== null ? savedFollow === 'true' : true;
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

  handleCheckboxClick(e) {
    e.stopPropagation(); // Prevent event from bubbling up to parent
  }

  handleFollowChange(e) {
    e.stopPropagation(); // Prevent event from bubbling up to parent
    this.follow = e.target.checked;
    // Save preference to localStorage
    localStorage.setItem('log-viewer-autoscroll', this.follow.toString());
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

    // Must have either pupId or jobId
    if (!this.pupId && !this.jobId) {
      return;
    }

    // Determine which endpoint to use
    const logType = this.jobId ? 'job' : 'pup';
    const logId = this.jobId || this.pupId;
    const wsUrl = `${store.networkContext.wsApiBaseUrl}/ws/log/${logType}/${logId}`;

    this.wsClient = new WebSocketClient(
      wsUrl,
      store.networkContext,
      mockedLogRunner
    );
    
    // Update component state based on WebSocket events
    this.wsClient.onOpen = (event) => {
      this.isConnected = true;
      this.requestUpdate();
    };

    this.wsClient.onMessage = async (event) => {
      // Handle different message formats
      let logMessage = event.data;
      if (typeof event.data === 'object') {
        logMessage = event.data.message || event.data.data || JSON.stringify(event.data);
      }
      this.logs = [...this.logs, logMessage];
      await this.requestUpdate();
      if (this.follow) {
        const logContainer = this.shadowRoot.querySelector('#LogContainer');
        logContainer.scrollTop = logContainer.scrollHeight;
      }
    };

    this.wsClient.onError = (event) => {
      console.error(`[Log Viewer] WebSocket error for ${logType} ${logId}:`, event);
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

  handleDownloadClick(e) {
    e.stopPropagation(); // Prevent event from bubbling up to parent
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
        <div id="LogContainer">
          ${this.logs.length > 0 ? html`
            <ul>
              ${this.logs.map(log => html`<li>${log}</li>`)}
            </ul>
          ` : html`
            <div class="no-logs-message">
              ${this.isConnected ? 'Waiting for logs...' : 'Logs not available'}
            </div>
          `}
        </div>
        <div id="LogFooter">
          <div class="options">
            <sl-checkbox
              size="medium"
              ?checked=${this.follow}
              @sl-change=${this.handleFollowChange}
              @click=${this.handleCheckboxClick}
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
      div#LogContainer {
        background: #0b0b0b;
        padding: 0.5em;
        height: var(--log-viewer-height, 150px);
        overflow-y: scroll;
        overflow-x: hidden;
        box-sizing: border-box;
      }

      div#LogFooter {
        display: flex;
        height: var(--log-footer-height, 40px);
        background: rgb(24, 24, 24);
        width: 100%;
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
      .no-logs-message {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100%;
        color: #666;
        font-style: italic;
        font-size: 0.85rem;
      }
    `;
  }
}

customElements.define('x-log-viewer', LogViewer);
