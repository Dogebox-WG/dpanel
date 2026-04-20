import {
  LitElement,
  html,
  css,
  nothing,
} from "/vendor/@lit/all@3.1.2/lit-all.min.js";

import "/components/common/tag-set/tag-set.js";
import { store } from "/state/store.js";
import { StoreSubscriber } from "/state/subscribe.js";
import { getInstallationStateProperties } from "../../../utils/installation-states.js";
import { pupUpdates } from "/state/pup-updates.js";

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
    this.context = new StoreSubscriber(this, store);
  }

  get updateInfo() {
    if (!this.pupId) return null;
    const { pupUpdatesContext } = this.context.store;
    return pupUpdatesContext.updateInfo[this.pupId] || null;
  }

  get hasUpdate() {
    // Use the pupUpdates singleton which respects skipped updates
    if (!this.pupId) return false;
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

  getOpenableSourceUrl(location) {
    if (!location || typeof location !== "string") return null;
    const trimmed = location.trim();
    if (!trimmed) return null;

    try {
      return new URL(trimmed).toString();
    } catch (_err) {
      try {
        return new URL(`https://${trimmed}`).toString();
      } catch (_err2) {
        return null;
      }
    }
  }

  handleOpenSourceUrl(event, url) {
    event.preventDefault();
    event.stopPropagation();
    if (!url) return;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  render() {
    const { 
      defaultIcon, pupName, version, logoBase64, 
      status, gui, short, href, upstreamVersions,
      installed, source,
      installationState
    } = this;
    const sourceUrl = this.getOpenableSourceUrl(source?.location);

    const getInstallationStatus = () => {
      // If the pup is not installed at all, show nothing
      if (!installed) {
        return nothing;
      }

      const status = getInstallationStateProperties(installationState?.id);

      return html`
        <div class="installation-badges">
          ${this.hasUpdate ? html`
            <sl-tag class="card-installation-tag" pill>
              Update Available <sl-icon class="card-installation-tag-icon" name="info-circle-fill"></sl-icon>
            </sl-tag>
          ` : nothing}
          <sl-tag pill variant=${status.variant}>
            ${(installationState?.label || 'Unknown').charAt(0).toUpperCase() + (installationState?.label || 'Unknown').slice(1)} <sl-icon class="card-installation-tag-icon" name=${status.icon}></sl-icon>
          </sl-tag>
        </div>
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
                <x-tag-set class="tag-set" .tags=${upstreamVersions} max=1></x-tag-set>
              </div>
            </div>
          </div>

          <div class="details-wrap secondary-details">
            <div class="inner">
              ${getInstallationStatus()}
            </div>
          </div>

          <div class="card-footer">
            <span class="source">
              ${this.renderSourceIcon(source?.type)}
              ${source?.location}
              ${source?.error ? html`
                <sl-icon name="exclamation-triangle-fill" style="color: var(--sl-color-danger-600); margin-left: 4px;"></sl-icon>
              ` : nothing}
            </span>
            ${sourceUrl ? html`
              <span
                class="open-url-link"
                role="link"
                tabindex="0"
                @click=${(event) => this.handleOpenSourceUrl(event, sourceUrl)}
                @keydown=${(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    this.handleOpenSourceUrl(event, sourceUrl);
                  }
                }}
              >
                <sl-icon name="box-arrow-up-right"></sl-icon>
              </span>
            ` : nothing}
          </div>

        </div>
      </a>
    `;
  }

  static styles = css`
    :host {
      --icon-size: 72px;
      --row-height: 114px;
      --card-footer-height: 2.2em;
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
      padding: 0.2em 1em;
      padding-bottom: calc(var(--card-footer-height) + 0.6em);
      box-sizing: border-box;
      overflow: hidden;
      gap: 0em;
      border-radius: 18px;
      background-image: linear-gradient(90deg, #2A343D 0%, #21242D 100%);
      box-shadow:
        0 4px 8px rgba(0, 0, 0, 0.4),
        0 12px 28px rgba(0, 0, 0, 0.28);
    }

    .pup-card-wrap > * {
      position: relative;
      z-index: 2;
    }

    .pup-card-wrap::after {
      content: "";
      position: absolute;
      inset: 0;
      border-radius: inherit;
      pointer-events: none;
      z-index: 0;
      background: radial-gradient(
        ellipse 85% 55% at 0% 0%,
        rgba(255, 255, 255, 0.14) 0%,
        rgba(255, 255, 255, 0.04) 35%,
        transparent 62%
      );
    }

    .pup-card-wrap::before {
      content: "";
      position: absolute;
      left: 0;
      right: 0;
      top: 0;
      bottom: var(--card-footer-height);
      border: 1px solid #414850;
      border-bottom: 0;
      border-radius: 18px 18px 0 0;
      box-sizing: border-box;
      pointer-events: none;
      z-index: 1;
      transition: border-color 350ms ease;
    }

    .pup-card-wrap:hover::before {
      border-color: #505A64;
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
      gap: 0.1rem;
    }

    span.name {
      font-family: 'Comic Neue';
      font-size: clamp(1.05rem, 0.5vw + 0.9rem, 1.2rem);
      font-weight: bold;
      margin-bottom: 0.15rem;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      text-overflow: ellipsis;
      max-height: 2.4em;
      line-height: 1.2;
    }

    span.description {
      margin-bottom: 0.15rem;
      font-weight: normal;
      font-size: clamp(0.92rem, 0.25vw + 0.84rem, 1rem);
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

    .installation-badges {
      display: flex;
      flex-direction: column;
      gap: 8px;
      align-items: flex-end;
    }

    .card-installation-tag-icon {
      display: inline-block;
      margin-left: 6px;
    }

    .card-footer {
      position: absolute;
      left: 0;
      right: 0;
      bottom: 0;
      min-height: var(--card-footer-height);
      display: flex;
      align-items: center;
      gap: 0.5em;
      padding: 0.4em 1em;
      border-top: 1px solid #414850;
      background: linear-gradient(180deg, #1D2229 0%, #1D2025 100%);
      border-radius: 0 0 18px 18px;
      box-sizing: border-box;
    }

    span.source {
      margin-left: calc(var(--icon-size) + 1em);
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: flex-end;
      gap: 4px;
      font-size: clamp(0.84rem, 0.2vw + 0.78rem, 0.92rem);
      color: #b5a1ff;
      text-align: right;
    }
    span.source sl-icon { position: relative; top: -1px; }

    .open-url-link {
      flex-shrink: 0;
      display: inline-flex;
      align-items: center;
      color: #b5a1ff;
      padding: 0;
      line-height: 1;
      cursor: pointer;
      user-select: none;
    }

    .open-url-link:focus-visible {
      outline: 1px solid #b5a1ff;
      border-radius: 4px;
    }
  `;
}

customElements.define("pup-install-card", PupInstallCard);
