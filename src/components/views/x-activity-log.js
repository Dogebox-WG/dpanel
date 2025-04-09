import { LitElement, html, css } from '/vendor/@lit/all@3.1.2/lit-all.min.js';

class ActivityLog extends LitElement {
  static get properties() {
    return {
      logs: { type: Array },
      follow: { type: Boolean },
      expanded: { type: Boolean, reflect: true },
      name: { type: String },
      empty: { type: Boolean, reflect: true }
    };
  }

  set logs(newValue) {
    if (!newValue) return;
    this._logs = newValue;
    this.empty = !newValue.length;
  }

  get logs() {
    return this._logs;
  }

  constructor() {
    super();
    this.logs = [];
    this.follow = true;
    this.expanded = false;
    this.name = "";
    this.empty = true;
  }

  firstUpdated() {
    const logContainer = this.shadowRoot.querySelector('#LogContainer');
    logContainer.addEventListener('scroll', () => {
      const isAtBottom = Math.abs(logContainer.scrollHeight - logContainer.clientHeight - logContainer.scrollTop) < 1;

      if (isAtBottom) {
        this.follow = true;
      } else {
        this.follow = false;
      }
    });
  }

  updated(changedProperties) {
    super.updated(changedProperties);

    if (changedProperties.has('logs')) {
      this.scrollToBottom();
    }
  }

  scrollToBottom() {
    if (this.follow) {
      const logContainer = this.shadowRoot.querySelector('#LogContainer');
      if (logContainer) {
        logContainer.scrollTop = logContainer.scrollHeight;
      }
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
    a.download = `log_${this.name}_${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();

    // Cleanup the temporary element
    document.body.removeChild(a);

  }

  render() {
    return html`
      <div>
        <div id="LogContainer">
          <ul>
            ${(this.logs || []).map(log => html`<li>${log.msg}</li>`)}
          </ul>
        </div>
        <div id="LogFooter">
          <div class="options">
            <!--sl-checkbox
              size="small"
              ?checked=${this.follow}
              @sl-change=${this.handleFollowChange}
            >Auto scroll</sl-checkbox-->
          <small>Activity Log</small>
          </div>
          <div class="more-options">
            <sl-button 
              variant="text"
              target="_blank"
              @click=${this.handleDownloadClick}
            >
              <sl-icon name="download" slot="suffix"></sl-icon>
            </sl-button>
            <sl-button 
              variant="text"
              @click=${() => this.expanded = !this.expanded}
            >
              <sl-icon name="${!this.expanded ? 'arrows-expand' : 'arrows-collapse'}" slot="suffix"></sl-icon>
            </sl-button>
        </div>
      </div>
    `;
  }

  static get styles() {
    return css`
      :host {
        --log-footer-height: 48px;
        --log-viewer-height: 120px;
        --margin-top: 0;
        --margin-bottom: 0;
        display: block;
        position: relative;
        margin-top: var(--margin-top);
        margin-bottom: var(--margin-bottom);
        overflow: hidden;
        transition: max-height 500ms ease-in-out;
        max-height: calc(var(--log-viewer-height) + var(--log-footer-height));
      }

      :host([expanded]) {
        --log-viewer-height: 400px;
      }

      :host([empty]) {
        max-height: 0;
      }

      div#LogContainer {
        background: #0b0b0b;
        padding: 0.5em;
        height: var(--log-viewer-height);
        overflow-y: scroll;
        overflow-x: hidden;
        box-sizing: border-box;
        text-align: left;
      }

      div#LogFooter {
        display: none /*block*/;
        height: var(--log-footer-height);
        background: rgb(24, 24, 24);
        width: 100%;
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
        padding: 0em .5em 0em 1em;
        box-sizing: border-box;

        .more-options {
          display: flex;
          flex-direction: row;
          gap: .5em;
        }
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
        text-align: left;
      }
    `;
  }

}

customElements.define('x-activity-log', ActivityLog);
