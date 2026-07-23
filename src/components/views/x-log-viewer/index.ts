import { LitElement, html, css } from '/lib/lit-all.js';
import { store } from '/state/store.js';
import WebSocketClient from '/api/sockets.js';
import { mockedLogRunner } from './log.mocks.js';

const LOG_PAGE_SIZE = 1000;
const OLDER_LOGS_LOAD_DELAY_MS = 500;

interface LogTarget {
  logType: string;
  logId: string;
}

interface LogPage {
  lines: string[];
  resumeToken: string | null;
  olderLogsCursor: string | null;
  hasMoreOlderLogs: boolean;
}

/** Object-form log socket payloads carry the line under message/data. */
interface LogSocketMessage {
  message?: string;
  data?: string;
}

/** Shoelace checkbox exposing a boolean checked state as an element property. */
interface SlCheckedEl extends HTMLElement { checked: boolean }

function isSlCheckedEl(target: EventTarget | null): target is SlCheckedEl {
  return target instanceof HTMLElement;
}

class LogViewer extends LitElement {
  declare autostart: boolean;
  declare logs: string[];
  declare isConnected: boolean;
  declare isLoadingHistory: boolean;
  declare follow: boolean;
  declare pupId: string;
  declare jobId: string;
  declare closing: boolean;
  declare animateOpen: boolean;
  declare animatingOpen: boolean;
  declare autoReconnect: boolean;
  declare connecting: boolean;
  declare isDownloading: boolean;
  declare isLoadingOlderLogs: boolean;
  declare hasMoreOlderLogs: boolean;
  declare olderLogsCursor: string | null;

  wsClient: WebSocketClient | null;
  _streamToken: number;
  _reconnectDelay: number;
  _reconnectTimer: ReturnType<typeof setTimeout> | null;
  _reconnectStopped: boolean;
  _scrollHandler: (() => void) | null;
  _olderLogsLoadTimer: ReturnType<typeof setTimeout> | null;
  _boundTransitionEnd?: (e: Event) => void;
  _openRaf?: number | null;

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
      animatingOpen: { type: Boolean, reflect: true },
      autoReconnect: { type: Boolean },
      connecting: { type: Boolean },
      isDownloading: { type: Boolean },
      isLoadingOlderLogs: { type: Boolean },
      hasMoreOlderLogs: { type: Boolean },
      olderLogsCursor: { type: String },
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
    this.follow = true; // Default to true, user can disable temporarily
    this.closing = false;
    this.animateOpen = false;
    this.animatingOpen = false;
    this.autoReconnect = false;
    this.connecting = false;
    this.isDownloading = false;
    this.isLoadingOlderLogs = false;
    this.hasMoreOlderLogs = false;
    this.olderLogsCursor = null;
    this._streamToken = 0;
    this._reconnectDelay = 0;
    this._reconnectTimer = null;
    this._reconnectStopped = false;
    this._scrollHandler = null;
    this._olderLogsLoadTimer = null;
  }

  connectedCallback() {
    super.connectedCallback();
    this._reconnectStopped = false;
    this.startLogStream();
    this._boundTransitionEnd = this._onTransitionEnd.bind(this);
    this.addEventListener('transitionend', this._boundTransitionEnd);
    if (this.animateOpen && (this.jobId || this.pupId)) {
      this.animatingOpen = true;
      this._openRaf = requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          this.animatingOpen = false;
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
    if (this._reconnectTimer) clearTimeout(this._reconnectTimer);
    if (this._olderLogsLoadTimer) clearTimeout(this._olderLogsLoadTimer);
    if (this._boundTransitionEnd) {
      this.removeEventListener('transitionend', this._boundTransitionEnd);
    }
    const logContainer = this.shadowRoot?.querySelector('#LogContainer');
    if (logContainer && this._scrollHandler) {
      logContainer.removeEventListener('scroll', this._scrollHandler);
    }
    super.disconnectedCallback();
    if (this.wsClient) {
      this.wsClient.disconnect();
      this.wsClient = null;
    }
  }

  updated(changedProperties: Map<PropertyKey, unknown>) {
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
    const logContainer = this.shadowRoot?.querySelector('#LogContainer');
    if (!logContainer) return;
    let wasAtBottom = true;
    
    this._scrollHandler = () => {
      const isAtBottom = Math.abs(logContainer.scrollHeight - logContainer.clientHeight - logContainer.scrollTop) < 1;
      
      // Only update follow if it needs to change
      if (isAtBottom && !this.follow) {
        this.follow = true;
      } else if (!isAtBottom && wasAtBottom && this.follow) {
        // Only set to false if user was at bottom and scrolled up
        this.follow = false;
      }
      
      wasAtBottom = isAtBottom;
      if (logContainer.scrollTop <= 1) {
        this.scheduleOlderLogsLoad();
      } else {
        if (this._olderLogsLoadTimer) clearTimeout(this._olderLogsLoadTimer);
        this._olderLogsLoadTimer = null;
      }
    };

    logContainer.addEventListener('scroll', this._scrollHandler);
  }

  handleCheckboxClick(e: Event) {
    e.stopPropagation(); // Prevent event from bubbling up to parent
  }

  handleFollowChange(e: Event) {
    e.stopPropagation(); // Prevent event from bubbling up to parent
    if (!isSlCheckedEl(e.target)) return;
    this.follow = e.target.checked;
    if (this.follow) {
      const logContainer = this.shadowRoot?.querySelector('#LogContainer');
      if (logContainer) {
        logContainer.scrollTop = logContainer.scrollHeight;
      }
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

  getLogTarget(): LogTarget | null {
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
    this.isLoadingOlderLogs = false;
    this.hasMoreOlderLogs = false;
    this.olderLogsCursor = null;
    if (this._olderLogsLoadTimer) clearTimeout(this._olderLogsLoadTimer);
    this._olderLogsLoadTimer = null;
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
    this.isLoadingOlderLogs = false;
    this.hasMoreOlderLogs = false;
    this.olderLogsCursor = null;
    if (this._olderLogsLoadTimer) clearTimeout(this._olderLogsLoadTimer);
    this._olderLogsLoadTimer = null;
    this.logs = [];
    this.requestUpdate();

    try {
      const { lines, resumeToken, olderLogsCursor, hasMoreOlderLogs } = await this.fetchInitialLogs(target);
      if (streamToken !== this._streamToken) {
        return;
      }

      this.logs = lines;
      this.olderLogsCursor = olderLogsCursor;
      this.hasMoreOlderLogs = hasMoreOlderLogs;
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

  async fetchInitialLogs(target: LogTarget) {
    return this.fetchLogPage(target);
  }

  async fetchLogPage(target: LogTarget, before: string | null = null): Promise<LogPage> {
    const headers: Record<string, string> = {};
    if (store.networkContext.token) {
      headers.Authorization = `Bearer ${store.networkContext.token}`;
    }

    const url = new URL(`/log/${target.logType}/${target.logId}/tail`, store.networkContext.apiBaseUrl);
    url.searchParams.set('limit', String(LOG_PAGE_SIZE));
    if (before !== null && before !== undefined) {
      url.searchParams.set('before', String(before));
    }

    const response = await fetch(
      url,
      { headers }
    );

    if (!response.ok) {
      throw new Error(`Initial log load failed with status ${response.status}`);
    }

    const payload = await response.json();
    return {
      lines: Array.isArray(payload.lines) ? payload.lines : [],
      resumeToken: typeof payload.resumeToken === 'string' ? payload.resumeToken : null,
      olderLogsCursor: typeof payload.olderCursor === 'string' ? payload.olderCursor : null,
      hasMoreOlderLogs: payload.hasMoreOlder === true,
    };
  }

  scheduleOlderLogsLoad(delayMs = OLDER_LOGS_LOAD_DELAY_MS) {
    const logContainer = this.shadowRoot?.querySelector('#LogContainer');
    if (!logContainer || logContainer.scrollTop > 1 || this._olderLogsLoadTimer) {
      return;
    }

    this._olderLogsLoadTimer = setTimeout(() => {
      this._olderLogsLoadTimer = null;
      this.loadOlderLogs();
    }, delayMs);
  }

  async loadOlderLogs() {
    const target = this.getLogTarget();
    const logContainer = this.shadowRoot?.querySelector('#LogContainer');
    if (!target || !logContainer || this.isLoadingHistory || this.isLoadingOlderLogs || !this.hasMoreOlderLogs || !this.olderLogsCursor || store.networkContext.useMocks) {
      return;
    }

    const streamToken = this._streamToken;
    const previousScrollHeight = logContainer.scrollHeight;
    const previousScrollTop = logContainer.scrollTop;
    this.isLoadingOlderLogs = true;
    this.requestUpdate();

    try {
      const page = await this.fetchLogPage(target, this.olderLogsCursor);
      if (streamToken !== this._streamToken) {
        return;
      }

      const olderLines = this.mergeOlderLogs(page.lines, this.logs);
      this.logs = olderLines;
      this.olderLogsCursor = page.olderLogsCursor;
      this.hasMoreOlderLogs = page.hasMoreOlderLogs;
      await this.updateComplete;

      requestAnimationFrame(() => {
        if (previousScrollTop <= 1) {
          logContainer.scrollTop = 0;
          this.scheduleOlderLogsLoad();
          return;
        }

        logContainer.scrollTop = previousScrollTop + (logContainer.scrollHeight - previousScrollHeight);
      });
    } catch (error) {
      console.warn('[Log Viewer] Failed to load older logs.', error);
    } finally {
      if (streamToken === this._streamToken) {
        this.isLoadingOlderLogs = false;
        this.requestUpdate();
      }
    }
  }

  mergeOlderLogs(olderLines: string[], currentLogs: string[]) {
    if (olderLines.length === 0) {
      return currentLogs;
    }

    const dedupedOlderLines = olderLines[olderLines.length - 1] === currentLogs[0]
      ? olderLines.slice(0, -1)
      : olderLines;

    return [...dedupedOlderLines, ...currentLogs];
  }

  canDownloadFullLog() {
    return this.jobId || (this.pupId && this.pupId !== 'dbx' && this.pupId !== 'dkm');
  }

  getPartialLogMessage() {
    if (!this.hasMoreOlderLogs) {
      return '';
    }

    return this.canDownloadFullLog()
      ? 'Only part of this log is loaded. Download to access the complete file.'
      : 'Only part of this log is loaded. Scroll up to load more.';
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

  setupSocketConnection(target: LogTarget | null = this.getLogTarget(), resumeToken: string | null = null) {
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
    this.wsClient.onOpen = () => {
      this.isConnected = true;
      this._reconnectDelay = 0;
      this.requestUpdate();
    };

    this.wsClient.onMessage = async (event) => {
      // Handle different message formats
      let logMessage: string = event.data;
      
      // If it's a string, try to parse as JSON first (backend sends JSON-encoded strings)
      if (typeof event.data === 'string') {
        try {
          logMessage = JSON.parse(event.data);
        } catch (e) {
          // If parsing fails, use as-is
          logMessage = event.data;
        }
      } else if (typeof event.data === 'object') {
        const dataObj: LogSocketMessage = event.data;
        logMessage = dataObj.message || dataObj.data || JSON.stringify(event.data);
      }
      
      // Deduplicate: skip if this exact message was just added
      if (this.logs.length > 0 && this.logs[this.logs.length - 1] === logMessage) {
        return;
      }
      
      this.logs = [...this.logs, logMessage];
      await this.requestUpdate();
      this.scrollToBottomIfNeeded();
    };

    this.wsClient.onError = (event) => {
      console.error(`[Log Viewer] WebSocket error for ${target.logType} ${target.logId}:`, event);
      this.isConnected = false;
      this.requestUpdate();
    };

    this.wsClient.onClose = () => {
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
    if (!this.autoReconnect || this._reconnectStopped) return;
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

  async handleDownloadClick(e: Event) {
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

    const headers: Record<string, string> = {};

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

  getDownloadFilename(response: Response, logId: string) {
    const contentDisposition = response.headers.get('Content-Disposition');
    const filenameMatch = contentDisposition?.match(/filename="?([^"]+)"?/);
    return filenameMatch?.[1] || `log_${logId}_${Date.now()}.txt`;
  }

  triggerDownload(blob: Blob, filename: string) {
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('no-intercept', 'true');
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(blobUrl);
  }

  _onTransitionEnd(e: Event) {
    if (e.target !== this || !(e instanceof TransitionEvent) || e.propertyName !== 'max-height' || !this.closing) return;
    this.dispatchEvent(new CustomEvent('log-viewer-closed', {
      bubbles: true,
      composed: true,
    }));
  }

  render() {
    const emptyStateMessage = this.connecting
      ? 'Connecting to log stream...'
      : this.isLoadingHistory
        ? 'Loading recent logs...'
        : this.isConnected
          ? 'Connected. Waiting for log output...'
          : 'Disconnected. Logs not available.';
    const partialLogMessage = this.getPartialLogMessage();

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
            ${this.isLoadingOlderLogs ? html`
              <div class="log-notices">
                <div class="log-notice loading">Loading older log entries...</div>
              </div>
            ` : null}
            <ul>
              ${this.logs.map(log => html`<li>${log}</li>`)}
            </ul>
          ` : html`
            <div class="no-logs-message">
              ${emptyStateMessage}
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
          ${partialLogMessage ? html`
            <div class="log-notice partial persistent">${partialLogMessage}</div>
          ` : null}
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

      :host([animatingOpen]) {
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
      div#LogFooter .options {
        display: flex;
        align-items: center;
        min-width: 0;
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
      .log-notices {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        margin-bottom: 0.75rem;
      }
      .log-notice {
        font-size: 0.8rem;
        line-height: 1.4;
        padding: 0.65rem 0.8rem;
        border-radius: 0.45rem;
      }
      .log-notice.partial {
        background: rgba(255, 193, 7, 0.15);
        color: #f7d774;
        border: 1px solid rgba(255, 193, 7, 0.3);
      }
      .log-notice.partial.persistent {
        flex: 1;
        margin: 0 1rem;
      }
      .log-notice.loading {
        background: rgba(255, 255, 255, 0.08);
        color: #ccc;
      }
    `;
  }
}

customElements.define('x-log-viewer', LogViewer);
