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
    this.autostart = true;
    this.follow = true; // Default to true, user can disable temporarily
  }

  connectedCallback() {
    super.connectedCallback();
    this.setupSocketConnection()
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    // Clean up WebSocket connection
    if (this.wsClient) {
      this.wsClient.disconnect();
      this.wsClient = null;
    }
  }

  updated(changedProperties) {
    if (changedProperties.has('autostart') && this.autostart) {
      this.wsClient && this.wsClient.connect();
    }
    
    // If jobId or pupId changes, reconnect to the new log stream
    if (changedProperties.has('jobId') || changedProperties.has('pupId')) {
      const oldJobId = changedProperties.get('jobId');
      const oldPupId = changedProperties.get('pupId');
      const newJobId = this.jobId;
      const newPupId = this.pupId;
      
      // Only reconnect if the ID actually changed (not just initial render)
      if (oldJobId !== undefined || oldPupId !== undefined) {
        if (oldJobId !== newJobId || oldPupId !== newPupId) {
          // Disconnect old connection
          if (this.wsClient) {
            this.wsClient.disconnect();
            this.wsClient = null;
            this.isConnected = false;
          }
          
          // Clear old logs
          this.logs = [];
          
          // Setup new connection
          this.setupSocketConnection();
          
          if (this.autostart && this.wsClient) {
            this.wsClient.connect();
          }
        }
      }
    }
  }

  firstUpdated() {
    const logContainer = this.shadowRoot.querySelector('#LogContainer');
    let wasAtBottom = true;
    
    logContainer.addEventListener('scroll', () => {
      const isAtBottom = Math.abs(logContainer.scrollHeight - logContainer.clientHeight - logContainer.scrollTop) < 1;
      
      // Only update follow if it needs to change
      if (isAtBottom && !this.follow) {
        this.follow = true;
      } else if (!isAtBottom && wasAtBottom && this.follow) {
        // Only set to false if user was at bottom and scrolled up
        this.follow = false;
      }
      
      wasAtBottom = isAtBottom;
    });
  }

  handleCheckboxClick(e) {
    e.stopPropagation(); // Prevent event from bubbling up to parent
  }

  handleFollowChange(e) {
    e.stopPropagation(); // Prevent event from bubbling up to parent
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
    // Prevent duplicate connections
    if (this.isConnected || this.wsClient) {
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
      
      // If it's a string, try to parse as JSON first (backend sends JSON-encoded strings)
      if (typeof event.data === 'string') {
        try {
          logMessage = JSON.parse(event.data);
        } catch (e) {
          // If parsing fails, use as-is
          logMessage = event.data;
        }
      } else if (typeof event.data === 'object') {
        logMessage = event.data.message || event.data.data || JSON.stringify(event.data);
      }
      
      // Deduplicate: skip if this exact message was just added
      if (this.logs.length > 0 && this.logs[this.logs.length - 1] === logMessage) {
        return;
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
        <div id="LogHUD">
            <div class="status">
              ${this.isConnected
                ? html`<sl-tag size="small" pill @click=${this.handleToggleConnection} variant="success">Connected</sl-tag>`
                : html`<sl-tag size="small" pill @click=${this.handleToggleConnection} variant="neutral">Disconnected</sl-tag>`
              }
            </div>
          </div>
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
        height: var(--log-viewer-height, 150px);
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
