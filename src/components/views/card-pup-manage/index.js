  import {
    LitElement,
    html,
    css,
    nothing,
    classMap
  } from "/vendor/@lit/all@3.1.2/lit-all.min.js";

  import "/components/common/tag-set/tag-set.js";
  import { store } from "/state/store.js";
  import { StoreSubscriber } from "/state/subscribe.js";
  import { pupUpdates } from "/state/pup-updates.js";

  class PupCard extends LitElement {
    static get properties() {
      return {
        pupId: { type: String },
        pupName: { type: String },
        version: { type: String },
        logoBase64: { type: String },
        defaultIcon: { type: String },
        status: { type: String },
        running: { type: Boolean },
        hasGui: { type: Boolean },
        href: { type: String },
        gref: { type: String },
        upstreamVersions: { type: Object },
      };
    }

    constructor() {
      super();
      this.context = new StoreSubscriber(this, store);
    }

    get updateInfo() {
      const { pupUpdatesContext } = this.context.store;
      return pupUpdatesContext.updateInfo[this.pupId] || null;
    }

    get hasUpdate() {
      // Use the pupUpdates singleton which respects skipped updates
      return pupUpdates.hasUpdate(this.pupId);
    }

    get status() {
      return this._status;
    }

    set status(newStatus) {
      this._status = newStatus;
      this.running = newStatus === 'running';
      this.requestUpdate();
    }

    render() {
      const { defaultIcon, logoBase64, pupName, version, status, hasGui, href, gref, upstreamVersions } = this;

      const statusClassMap = classMap({
        status: true,
        running: status === "running"
      });
      return html`
        <a class="anchor" href=${href} target="_self">
          <div class="pup-card-wrap">
            <div class="icon-wrap ${logoBase64 ? 'has-logo' : ''}">
              ${logoBase64 ? html`<img style="width: 100%" src="${logoBase64}" />` : html`<sl-icon name="${defaultIcon}"></sl-icon>`}
            </div>

            <div class="details-wrap">
              <div class="inner">
                <span class="name">
                  ${pupName} 
                  <small style="color: #777">v${version}</small>
                  ${this.hasUpdate ? html`
                    <sl-badge variant="primary" pill pulse>Update Available</sl-badge>
                  ` : nothing}
                </span>
                <x-tag-set .tags=${upstreamVersions} highlight max=1></x-tag-set>
                <span class=${statusClassMap}>${status}</span>
              </div>
            </div>

            <div class="suffix-wrap">
              ${hasGui ? html`
                <sl-icon-button 
                  class="cta"
                  variant="link"
                  href="${gref}"
                  target="_self"
                  name="box-arrow-up-right">
                </sl-icon-button>
              ` : nothing }
            </div>
          </div>
        </a>
      `;
    }

    static styles = css`
      :host {
        --icon-size: 72px;
        --row-height: 114px;
      }

      a, button {
        touch-action: manipulation;
      }

      .anchor {
        touch-action: manipulation;
        text-decoration: none;
        color: inherit;
      }

      .pup-card-wrap {
        display: flex;
        flex-direction: row;
        margin-bottom: 1em;
        width: 100%;
        padding: 1em;
        box-sizing: border-box;
        overflow: hidden;
      }

      .pup-card-wrap:hover {
        background: rgb(46, 45, 51);
        cursor: pointer;
      }

      .icon-wrap {
        flex: 1 0 auto; /* can grow, cannot shrink */
        display: flex;
        width: var(--icon-size);
        height: var(--icon-size);
        border-radius: 84px;
        background: #e39704;
        justify-content: center;
        align-items: center;
        font-size: 2em;
        box-sizing: border-box;
        margin-right: 0.5em;
        margin-top: calc((var(--row-height) - var(--icon-size)) / 2);
      }

      .icon-wrap.has-logo {
        background: none;
      }

      .details-wrap {
        flex: 1 1 auto; /* can grow, can shrink */
        display: flex;
        align-items: center;
        border-bottom: 1px solid #333;
        width: 100%;
        height: var(--row-height);
      }

      .details-wrap .inner {
        display: flex;
        flex-direction: column;
        align-items: start;
        line-height: 1.5;
      }

      .suffix-wrap {
        flex: 0 0 auto; /* cannot grow, cannot shrink */
        width: 24px;
        height: var(--row-height);
        border-bottom: 1px solid #333;
        display: flex;
        align-items: center;

        .cta {
          position: relative;
          bottom: 0px;
          left: -1em;
        }
      }

      span.name {
        font-family: 'Comic Neue';
        font-size: 1.2rem;
        font-weight: bold;
      }

      span.version {
        font-weight: 100;
        font-size: 0.9rem;
      }

      span.status {
        line-height: 1.7;
        text-transform: capitalize;
        font-size: 0.9rem;
        color: grey;
      }

      span.status.running {
        color: #07ffae;
      }
    `;
  }

  customElements.define("pup-card", PupCard);