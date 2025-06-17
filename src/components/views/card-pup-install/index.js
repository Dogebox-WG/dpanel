import {
  LitElement,
  html,
  css,
  nothing,
} from "/vendor/@lit/all@3.1.2/lit-all.min.js";

import "/components/common/tag-set/tag-set.js";
import { getInstallationStateProperties } from "../../../utils/installation-states.js";

class PupInstallCard extends LitElement {
  static get properties() {
    return {
      pupId: { type: String },
      pupName: { type: String },
      logoBase64: { type: String },
      defaultIcon: { type: String },
      version: { type: String },
      short: { type: String },
      status: { type: String },
      running: { type: Boolean },
      hasGui: { type: Boolean },
      href: { type: String },
      gref: { type: String },
      upstreamVersions: { type: Object },
      installed: { type: Boolean },
      updateAvailable: { type: Boolean },
      source: { type: Object },
      installationState: { type: Object }
    };
  }

  constructor() {
    super();
    this.href = ""
    this.source = {};
    this.installationState = { id: null, label: null };
  }

  get status() {
    return this._status;
  }

  set status(newStatus) {
    this._status = newStatus;
    this.running = newStatus === 'running';
    this.requestUpdate();
  }

  get installationState() {
    return this._installationState;
  }

  set installationState(newState) {
    this._installationState = newState;
    this.requestUpdate();
  }

  renderSourceIcon(sourceType) {
    let icon;
    switch (sourceType) {
      case 'git':
        icon = 'git';
        break;
      case 'disk':
         icon = 'hdd-fill'
        break;
    }
    if (!icon) return nothing;
    return html`
      <sl-icon name=${icon}></sl-icon>
    `
  }

  render() {
    const { 
      defaultIcon, pupName, version, logoBase64, 
      status, gui, short, href, upstreamVersions,
      installed, updateAvailable, source,
      installationState
    } = this;

    const getInstallationStatus = () => {
      // If the pup is not installed at all, show nothing
      if (!installed) {
        return nothing;
      }

      // If an update is available, show that
      if (updateAvailable) {
        return html`
          <sl-tag class="card-installation-tag" pill variant="primary">
            Update Available <sl-icon class="card-installation-tag-icon" name="info-circle-fill"></sl-icon>
          </sl-tag>
        `;
      }

      const status = getInstallationStateProperties(installationState?.id);

      return html`
        <sl-tag pill variant=${status.variant}>
          ${(installationState?.label || 'Unknown').charAt(0).toUpperCase() + (installationState?.label || 'Unknown').slice(1)} <sl-icon class="card-installation-tag-icon" name=${status.icon}></sl-icon>
        </sl-tag>
      `;
    };

    return html`
      <a class="anchor" href=${href} target="_self">
        <div class="pup-card-wrap">
          <div class="primary-details">
            <div class="icon-wrap ${logoBase64 ? 'has-logo' : ''}">
              ${logoBase64 ? html`<img style="width: 100%" src="${logoBase64}" />` : html`<sl-icon name="${defaultIcon}"></sl-icon>`}
            </div>
            <div class="details-wrap">
              <div class="inner">
                <span class="name">${pupName}  <small style="color: #777">v${version}</small></span>
                <span class="description">${short}</span>
                <span class="source">
                  ${this.renderSourceIcon(source?.type)}
                  ${source?.location}
                </span>
                <x-tag-set class="tag-set" .tags=${upstreamVersions} max=1></x-tag-set>
              </div>
            </div>
          </div>

          <div class="details-wrap secondary-details">
            <div class="inner">
              ${getInstallationStatus()}
            </div>
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

    :host([installed]) .icon-wrap {
      background: #4d4d4d;
    }

    .pup-card-wrap {
      position: relative;
      display: flex;
      flex-direction: row;
      margin-bottom: 1em;
      width: 100%;
      padding: 1em;
      box-sizing: border-box;
      overflow: hidden;
      gap: 0em;
    }
    .pup-card-wrap::after {
      content: "";
      height: 1px;
      margin-left: calc(var(--icon-size) + 1em);
      width: 75%;
      background: #444;
      position: absolute;
      bottom: 16px;
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
      margin-top: calc((var(--row-height) - var(--icon-size)) / 2);
    }

    .icon-wrap.has-logo {
      background: none;
    }

    .primary-details {
      display: flex;
      flex-direction: row;
      gap: 1em;
    }

    .details-wrap.secondary-details {
      position: absolute;
      justify-content: end;
      top: -30px;
      right: 8px;
      @media (min-width: 576px) {
        position: relative;
        justify-content: center;
        top: 0px;
        right: 0px;
      }
    }

    .details-wrap {
      flex: 1 1 auto; /* can grow, can shrink */
      display: flex;
      align-items: center;
      width: 100%;
      height: var(--row-height);
    }

    .details-wrap .inner {
      display: flex;
      flex-direction: column;
      align-items: start;
      line-height: 1.3;
    }

    span.name {
      font-family: 'Comic Neue';
      font-size: 1.2rem;
      font-weight: bold;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      text-overflow: ellipsis;
      max-height: 2.4em;
      line-height: 1.2;
    }

    span.description {
      margin-bottom:;
      font-weight: normal;
      font-size: .9rem;
      display: -webkit-box;
      -webkit-line-clamp: 1;
      -webkit-box-orient: vertical;
      overflow: hidden;
      text-overflow: ellipsis;
      max-height: 2.4em;
      line-height: 1.1;
    }

    span.version {
      font-weight: 100;
      font-size: 0.9rem;
    }

    span.status {
      line-height: 1.5;
      text-transform: capitalize;
      color: #00c3ff;
      font-size: 0.9rem;
    }

    .tag-set {
      margin-top: 6px;
    }

    .card-installation-tag-icon {
      display: inline-block;
      margin-left: 6px;
    }

    span.source {
      margin-top: 2px;
      display: flex;
      flex-direction: row;
      align-items: center;
      gap: 4px;
      font-size: 0.85rem;
      color: #b5a1ff;
    }
    span.source sl-icon { position: relative; top: 2px; }
  `;
}

customElements.define("pup-install-card", PupInstallCard);
