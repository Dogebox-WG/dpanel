import { LitElement, html, css } from '/vendor/@lit/all@3.1.2/lit-all.min.js';
import { store } from '/state/store.js';
import WebSocketClient from '/api/sockets.js';
import { mockedLogRunner } from './log.mocks.js';

const MAX_LOG_LINES = 1000;

class LogViewer extends LitElement {
  static get properties() {
    return {
      autostart: { type: Boolean },
      logs: { type: Array },
      isConnected: { type: Boolean },
      isLoadingHistory: { type: Boolean },
      follow: { type: Boolean },
      pupId: { type: String },
      jobId: { type: String },
      closing: { type: Boolean, reflect: true },
      animateOpen: { type: Boolean },
      opening: { type: Boolean, reflect: true },
      reconnect: { type: Boolean },
      connecting: { type: Boolean },
      isDownloading: { type: Boolean },
    };
  }

  constructor() {
    super();
    this.logs = [];
    this.pupId = "";
    this.jobId = "";
    this.isConnected = false;
    this.isLoadingHistory = false;
    this.wsClient = null;
    this.autostart = true;
    this.follow = true;
    this.closing = false;
    this.animateOpen = false;
    this.opening = false;
    this.reconnect = false;
    this.connecting = false;
    this.isDownloading = false;
    this._streamToken = 0;
    this._reconnectDelay = 0;
    this._reconnectTimer = null;
    this._reconnectStopped = false;
  }

  connectedCallback() {
    super.connectedCallback();
    this._reconnectStopped = false;
    this.startLogStream();
    this._boundTransitionEnd = this._onTransitionEnd.bind(this);
    this.addEventListener('transitionend', this._boundTransitionEnd);
    if (this.animateOpen && (this.jobId || this.pupId)) {
      this.opening = true;
      this._openRaf = requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          this.opening = false;
          this._openRaf = null;
        });
      });
    }
  }

  disconnectedCallback() {
    this._streamToken += 1;
    if (this._openRaf) {
      cancelAnimationFrame(this._openRaf);
      this._openRaf = null;
    }
    this._reconnectStopped = true;
    clearTimeout(this._reconnectTimer);
    this.removeEventListener('transitionend', this._boundTransitionEnd);
    super.disconnectedCallback();
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
          // Disconnect old connection, clear old logs, and setup the new connection.
          this.resetLogStream();
          this.startLogStream();
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
    if (!this.wsClient) {
      return;
    }

    if (this.wsClient.isConnected) {
      this.wsClient.disconnect();
    } else {
      this.wsClient.connect();
    }
  }

  getLogTarget() {
    // Must have either pupId or jobId
    if (!this.pupId && !this.jobId) {
      return null;
    }

    // Determine which endpoint to use
    return {
      logType: this.jobId ? 'job' : 'pup',
      logId: this.jobId || this.pupId,
    };
  }

  resetLogStream() {
    this._streamToken += 1;
    this.isLoadingHistory = false;
    if (this.wsClient) {
      this.wsClient.disconnect();
      this.wsClient = null;
    }
    this.isConnected = false;
    this.logs = [];
  }

  async startLogStream() {
    const target = this.getLogTarget();
    if (!target) {
      return;
    }

    const streamToken = ++this._streamToken;

    if (store.networkContext.useMocks) {
      this.isLoadingHistory = false;
      this.setupSocketConnection(target);
      return;
    }

    this.isLoadingHistory = true;
    this.logs = [];
    this.requestUpdate();

    try {
      const { lines, resumeToken } = await this.fetchInitialLogs(target);
      if (streamToken !== this._streamToken) {
        return;
      }

      this.logs = this.trimLogs(lines);
      this.setupSocketConnection(target, resumeToken);
      await this.requestUpdate();
      this.scrollToBottomIfNeeded();
    } catch (error) {
      if (streamToken !== this._streamToken) {
        return;
      }

      console.warn('[Log Viewer] Failed to load initial logs, falling back to live stream only.', error);
      this.setupSocketConnection(target);
    } finally {
      if (streamToken === this._streamToken) {
        this.isLoadingHistory = false;
        this.requestUpdate();
      }
    }
  }

  async fetchInitialLogs(target) {
    const headers = {};
    if (store.networkContext.token) {
      headers.Authorization = `Bearer ${store.networkContext.token}`;
    }

    const response = await fetch(
      `${store.networkContext.apiBaseUrl}/log/${target.logType}/${target.logId}/tail?limit=${MAX_LOG_LINES}`,
      { headers }
    );

    if (!response.ok) {
      throw new Error(`Initial log load failed with status ${response.status}`);
    }

    const payload = await response.json();
    return {
      lines: Array.isArray(payload.lines) ? payload.lines : [],
      resumeToken: typeof payload.resumeToken === 'string' ? payload.resumeToken : null,
    };
  }

  trimLogs(logs) {
    return logs.length > MAX_LOG_LINES
      ? logs.slice(logs.length - MAX_LOG_LINES)
      : logs;
  }

  scrollToBottomIfNeeded() {
    if (!this.follow) {
      return;
    }

    const logContainer = this.shadowRoot?.querySelector('#LogContainer');
    if (!logContainer) {
      return;
    }

    requestAnimationFrame(() => {
      logContainer.scrollTop = logContainer.scrollHeight;
    });
  }

  setupSocketConnection(target = this.getLogTarget(), resumeToken = null) {
    // Prevent duplicate connections
    if (this.isConnected || this.wsClient) {
      return;
    }

    if (!target) {
      return;
    }

    const wsUrl = new URL(`/ws/log/${target.logType}/${target.logId}`, store.networkContext.wsApiBaseUrl);
    if (resumeToken !== null && resumeToken !== undefined) {
      wsUrl.searchParams.set('resumeToken', String(resumeToken));
    }

    this.wsClient = new WebSocketClient(
      wsUrl.toString(),
      store.networkContext,
      mockedLogRunner
    );
    
    // Update component state based on WebSocket events
    this.wsClient.onOpen = (event) => {
      this.isConnected = true;
      this._reconnectDelay = 0;
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
      
      const updatedLogs = [...this.logs, logMessage];
      this.logs = this.trimLogs(updatedLogs);
      await this.requestUpdate();
      this.scrollToBottomIfNeeded();
    };

    this.wsClient.onError = (event) => {
      console.error(`[Log Viewer] WebSocket error for ${target.logType} ${target.logId}:`, event);
      this.isConnected = false;
      this.requestUpdate();
    };

    this.wsClient.onClose = (event) => {
      this.isConnected = false;
      this.wsClient = null;
      this.requestUpdate();
      this._scheduleReconnect();
    };

    if (this.autostart) {
      this.wsClient.connect();
    }
  }

  _scheduleReconnect() {
    if (!this.reconnect || this._reconnectStopped) return;
    if (!this.jobId && !this.pupId) return;

    const BASE = 1000;
    const MAX = 15000;
    this._reconnectDelay = Math.min(
      this._reconnectDelay ? this._reconnectDelay * 2 : BASE,
      MAX,
    );

    this._reconnectTimer = setTimeout(() => {
      if (this._reconnectStopped) return;
      this.setupSocketConnection();
    }, this._reconnectDelay);
  }

  async handleDownloadClick(e) {
    e.stopPropagation(); // Prevent event from bubbling up to parent
    if (this.isDownloading) {
      return;
    }

    if (store.networkContext.useMocks || !this.getLogTarget()) {
      this.downloadBufferedLogs();
      return;
    }

    this.isDownloading = true;

    try {
      await this.downloadFullLog();
    } catch (error) {
      console.warn('[Log Viewer] Failed to download full log, falling back to buffered logs.', error);
      this.downloadBufferedLogs();
    } finally {
      this.isDownloading = false;
    }
  }

  async downloadFullLog() {
    const target = this.getLogTarget();
    if (!target) {
      throw new Error('No log target available for download');
    }

    const headers = {};

    if (store.networkContext.token) {
      headers.Authorization = `Bearer ${store.networkContext.token}`;
    }

    const response = await fetch(
      `${store.networkContext.apiBaseUrl}/log/${target.logType}/${target.logId}/download`,
      { headers }
    );

    if (!response.ok) {
      throw new Error(`Download failed with status ${response.status}`);
    }

    const blob = await response.blob();
    const filename = this.getDownloadFilename(response, target.logId);
    this.triggerDownload(blob, filename);
  }

  downloadBufferedLogs() {
    const logId = this.jobId || this.pupId || 'unknown';
    const textToDownload = this.logs.length > 0 ? `${this.logs.join('\n')}\n` : '';
    const blob = new Blob([textToDownload], { type: 'text/plain' });
    this.triggerDownload(blob, `log_${logId}_${Date.now()}.txt`);
  }

  getDownloadFilename(response, logId) {
    const contentDisposition = response.headers.get('Content-Disposition');
    const filenameMatch = contentDisposition?.match(/filename="?([^"]+)"?/);
    return filenameMatch?.[1] || `log_${logId}_${Date.now()}.txt`;
  }

  triggerDownload(blob, filename) {
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('no-intercept', true);
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(blobUrl);
  }

  _onTransitionEnd(e) {
    if (e.target !== this || e.propertyName !== 'max-height' || !this.closing) return;
    this.dispatchEvent(new CustomEvent('log-viewer-closed', {
      bubbles: true,
      composed: true,
    }));
  }

  render() {
    return html`
      <div>
        <div id="LogHUD">
          <div class="status">
            ${this.connecting
              ? html`<sl-tag size="small" pill variant="primary">Connecting</sl-tag>`
              : this.isConnected
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
              ${this.connecting
                ? 'Waiting for logs...'
                : this.isLoadingHistory
                ? 'Loading logs...'
                : this.isConnected
                  ? 'Waiting for logs...'
                  : 'Logs not available'}
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
            ?loading=${this.isDownloading}
            ?disabled=${this.isDownloading}
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
        overflow: hidden;
        transition: max-height 500ms ease-in-out;
        max-height: calc(var(--log-viewer-height, 150px) + var(--log-footer-height));
      }

      :host([closing]) {
        max-height: 0;
      }

      :host([opening]) {
        max-height: 0;
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
