import { LitElement, html, css } from "/vendor/@lit/all@3.1.2/lit-all.min.js";
import { themes } from "/components/common/dynamic-form/themes.js";
import { asyncTimeout } from "/utils/timeout.js";
import { getIP } from "/api/reflector/get-ip.js";
import "/components/common/text-loader/text-loader.js";

class DogeboxLauncherButton extends LitElement {
  static get properties() {
    return {
      reflectorToken: { type: String },
      _ready: { type: Boolean },
      _host: { type: String },
    };
  }

  constructor() {
    super();
    this._ready = false;
    this._host = window.location.hostname;

    this.errcode = null;

    this._serverFault = false;

    // This gives us 60 seconds of checking.
    this.checkInterval = 3000;
    this.checkCount = 0;
    this.maxCheckCount = 20;

    this._timedOut = false;
  }

  firstUpdated() {
    this._intervalId = setInterval(() => {
      if (this._ready) {
        clearInterval(this._intervalId);
      } else {
        this.check();
        this.checkCount++;

        if (this.checkCount >= this.maxCheckCount) {
          this._timedOut = true;
          this.errcode = "ip_wait_timeout";
          clearInterval(this._intervalId);
          this.requestUpdate();
        }
      }
    }, this.checkInterval);
  }

  disconnectedCallback() {
    if (this._intervalId) {
      clearInterval(this._intervalId);
    }
  }

  async check() {
    try {
      const res = await getIP(this.reflectorToken);
      if (res.ip) {
        if (this.stateData?.initialDeviceName) {
          this._host = `${this.stateData.deviceName}.local`;
        } else {
          this._host = res.ip;
        }
        this._ready = true;
      }
    } catch (e) {
      if (e.message.includes("not found")) {
        // Ignore, we just haven't got an IP address yet.
        return;
      }

      clearInterval(this._intervalId);
      this._serverFault = true;
      this.errcode = "contacting_reflector";
      console.error("Failed to contact reflector", e);
      this.requestUpdate();
    }
  }

  static styles = [
    themes,
    css`
      .action-wrap {
        display: flex;
        flex-direction: row;
        gap: 1em;
        align-items: center;
        justify-content: center;
        position: relative;
      }

      span.side-text {
        color: #ccc;
        font-size: 0.9rem;
        font-family: var(--sl-font-sans);
      }
    `,
  ];

  render() {
    if (this._serverFault || this._timedOut) {
      const alertVariant = this._serverFault ? "danger" : "warning";

      const text = this._serverFault
        ? "Failed to determine your Dogebox IP address."
        : "Timed out while waiting for Dogebox to come online.";

      return html`
        <div class="action-wrap">
          <sl-alert variant="${alertVariant}" open>
            <sl-icon slot="icon" name="exclamation-triangle"></sl-icon>
            ${text} Please refresh to try and connect, or join the Dogebox
            Discord server if the problem persists.
          </sl-alert>
        </div>
        <span style="font-size: 0.8rem; color: #808080;">
          Error code: ${this.errcode}
        </span>
      `;
    }

    return html`
      <div class="action-wrap">
        <sl-tooltip content=${this._ready ? this._host : "Dogebox IP unknown"}>
          <sl-button
            size="large"
            href="http://${this._host}:8080"
            target="_blank"
            ?disabled=${!this._ready}
            variant="${this._ready ? "primary" : null}"
            >Launch Dogebox</sl-button
          >
        </sl-tooltip>
        <span class="side-text" href="http://${this._host}">
          <text-loader
            .texts=${["Checking", "HOdL tight"]}
            ?loopEnd=${this._ready}
            endText="${this._host}"
            loop
          ></text-loader>
        </span>
      </div>
    `;
  }
}

customElements.define("x-launcher-button", DogeboxLauncherButton);
