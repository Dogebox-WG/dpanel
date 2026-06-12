import {
  LitElement,
  html,
  css,
  nothing,
  unsafeHTML,
} from "/vendor/@lit/all@3.1.2/lit-all.min.js";

import "/components/common/dbx-modal/index.js";
import "/components/views/action-check-updates/index.js";
import "/components/views/action-remote-access/index.js";
import "/components/common/welcome-modal.js";

import {
  GALLERY_ENTRIES,
  IMPORT_BLOCKCHAIN_CUSTOM_HTML,
  closeAllGalleryLegacyDialogs,
} from "./gallery-entries.js";

class DevModalsPage extends LitElement {
  static properties = {
    _activeEntryId: { type: String },
    _afterOpen: { type: Boolean },
    _nestedChildOpen: { type: Boolean },
  };

  static styles = css`
    :host {
      display: block;
    }

    .padded {
      padding: 1.5em 2em 4em;
      max-width: 1200px;
      margin: 0 auto;
    }

    h1 {
      font-family: "Comic Neue", sans-serif;
      margin-top: 0;
    }

    .intro {
      color: var(--sl-color-neutral-500);
      margin-bottom: 2em;
      line-height: 1.5;
    }

    .entry {
      border: 1px solid var(--sl-color-neutral-200);
      border-radius: var(--sl-border-radius-medium);
      margin-bottom: 1.5em;
      overflow: hidden;
    }

    .entry-name {
      font-family: "Comic Neue", sans-serif;
      font-weight: bold;
      padding: 0.75em 1em;
      background: var(--sl-color-neutral-100);
      border-bottom: 1px solid var(--sl-color-neutral-200);
    }

    .compare {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0;
    }

    @media (max-width: 720px) {
      .compare {
        grid-template-columns: 1fr;
      }
    }

    .column {
      padding: 1em;
      display: flex;
      flex-direction: column;
      gap: 0.75em;
    }

    .column.before {
      border-right: 1px solid var(--sl-color-neutral-200);
    }

    @media (max-width: 720px) {
      .column.before {
        border-right: none;
        border-bottom: 1px solid var(--sl-color-neutral-200);
      }
    }

    .column-label {
      font-size: var(--sl-font-size-small);
      font-weight: var(--sl-font-weight-bold);
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: var(--sl-color-neutral-600);
    }

    .note {
      font-size: var(--sl-font-size-small);
      color: var(--sl-color-neutral-500);
      line-height: 1.4;
      flex: 1;
    }

    .mock-tabs {
      text-align: center;
      color: var(--sl-color-neutral-500);
      padding: 1.5em;
      border: 1px dashed var(--sl-color-neutral-300);
      border-radius: var(--sl-border-radius-medium);
    }

    .welcome-cards {
      display: flex;
      flex-direction: column;
      gap: 1em;
      margin: 0.5em 0 0;
    }

    .welcome-card {
      position: relative;
      display: flex;
      flex-direction: row;
      align-items: flex-start;
      gap: 1.5em;
      min-height: 150px;
      width: 100%;
      padding: 1em;
      box-sizing: border-box;
      border: 1px solid var(--sl-panel-border-color);
      border-radius: var(--sl-border-radius-medium);
      background: var(--sl-panel-background-color);
      cursor: default;
    }

    .welcome-card__image {
      width: 120px;
      height: 120px;
      min-width: 120px;
      flex-shrink: 0;
      border-radius: var(--sl-border-radius-small);
      overflow: hidden;
    }

    .welcome-card__image img {
      display: block;
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .welcome-card__content {
      flex: 1;
      min-width: 0;
      text-align: left;
    }

    .welcome-card__title {
      font-family: "Comic Neue", sans-serif;
      font-size: 1.5em;
      font-weight: bold;
      margin: 0 0 0.5em;
    }

    .welcome-card__subtitle {
      margin: 0;
      font-size: 0.9em;
      color: var(--sl-color-neutral-500);
      line-height: 1.4;
    }

    .welcome-card__badge {
      position: absolute;
      top: 0.5em;
      right: 0.5em;
      padding: 0.25em 0.75em;
      border-radius: var(--sl-border-radius-small);
      background-color: #ffd700;
      color: #000;
      font-size: 0.8em;
      font-weight: bold;
    }

    @media (max-width: 640px) {
      .welcome-card__image {
        width: 100px;
        height: 100px;
        min-width: 100px;
      }
    }

    pre.error-mock {
      text-wrap: wrap;
      font-size: var(--sl-font-size-small);
      padding: 1em;
      background: #333;
      margin: 0 0 0.5em;
    }

    pre.error-mock.stack {
      background: #c700ff21;
      font-size: var(--sl-font-size-x-small);
    }
  `;

  constructor() {
    super();
    this._activeEntryId = null;
    this._afterOpen = false;
    this._nestedChildOpen = false;
  }

  _getActiveEntry() {
    return GALLERY_ENTRIES.find((e) => e.id === this._activeEntryId);
  }

  _closeAfter() {
    this._afterOpen = false;
    this._nestedChildOpen = false;
    this._activeEntryId = null;
  }

  _openBefore(entry) {
    this._closeAfter();
    closeAllGalleryLegacyDialogs();
    entry.openBefore();
  }

  _openAfter(entry) {
    closeAllGalleryLegacyDialogs();
    this._activeEntryId = entry.id;
    this._afterOpen = true;
    this._nestedChildOpen = false;
  }

  _handleAfterClose() {
    this._closeAfter();
  }

  _renderAfterCustom(customKey) {
    switch (customKey) {
      case "power-off-success":
        return html`
          <img slot="custom" style="width:100%;" src="/static/img/bye.png" alt="" />
        `;
      case "reboot-success":
        return html`
          <img slot="custom" style="width:100%;" src="/static/img/again.png" alt="" />
        `;
      case "error-details":
        return html`
          <div slot="custom">
            <pre class="error-mock">Something went wrong</pre>
            <pre class="error-mock" style="background:#a300ff70;">Example error for gallery</pre>
            <pre class="error-mock stack">Error: Example error for gallery\n    at gallery (dev-modals:1:1)</pre>
          </div>
        `;
      case "system-updates":
        return html`<x-action-check-updates slot="custom" hide-title></x-action-check-updates>`;
      case "import-blockchain":
        return html`<div slot="custom">${unsafeHTML(IMPORT_BLOCKCHAIN_CUSTOM_HTML)}</div>`;
      case "remote-access":
        return html`<x-action-remote-access slot="custom" hide-title></x-action-remote-access>`;
      case "add-ssh-key":
        return html`
          <sl-textarea
            slot="custom"
            rows="6"
            help-text="Important: Enter your public key"
            placeholder="ssh-ed25519 AAAA…"
          ></sl-textarea>
        `;
      case "language":
        return html`
          <sl-select slot="custom" label="Keymap" help-text="What keyboard layout do you have?" hoist>
            <sl-option value="us">English (US)</sl-option>
            <sl-option value="uk">English (UK)</sl-option>
          </sl-select>
        `;
      case "welcome":
        return html`
          <div slot="custom" class="welcome-cards">
            <div class="welcome-card">
              <span class="welcome-card__badge">Recommended</span>
              <div class="welcome-card__image">
                <img
                  src="/static/img/pup-collection-essentials.png"
                  alt="Essentials Collection"
                />
              </div>
              <div class="welcome-card__content">
                <div class="welcome-card__title">Essentials</div>
                <p class="welcome-card__subtitle">
                  Gets you up and running with Dogecoin Core, Dogenet, DogeMap,
                  Identity
                </p>
              </div>
            </div>
            <div class="welcome-card">
              <div class="welcome-card__image">
                <img
                  src="/static/img/pup-collection-core.png"
                  alt="Core Only Collection"
                />
              </div>
              <div class="welcome-card__content">
                <div class="welcome-card__title">Core Only</div>
                <p class="welcome-card__subtitle">Nothing but Dogecoin Core</p>
              </div>
            </div>
            <div class="welcome-card">
              <div class="welcome-card__image">
                <img
                  src="/static/img/pup-collection-custom.png"
                  alt="Custom Collection"
                />
              </div>
              <div class="welcome-card__content">
                <div class="welcome-card__title">Custom</div>
                <p class="welcome-card__subtitle">
                  Choose your own adventure. No preinstalled pups
                </p>
              </div>
            </div>
          </div>
        `;
      case "pup-uninstall":
        return html`
          <sl-input
            slot="custom"
            placeholder="Type 'Example Pup' to confirm"
          ></sl-input>
        `;
      case "manage-sources-add":
        return html`
          <sl-input
            slot="custom"
            label="Enter source URL"
            placeholder="Eg: https://github.com/Dogebox-WG/pups.git"
          ></sl-input>
        `;
      case "monitoring-add":
        return html`
          <div slot="custom" class="mock-tabs">
            Pups · System · Services tab grid placeholder
          </div>
        `;
      case "nested":
        return html`
          <p slot="custom" style="text-align:center;padding:1em 0;">
            Parent settings shell (x-dbx-modal)
          </p>
        `;
      default:
        return nothing;
    }
  }

  _renderAfterModal() {
    const entry = this._getActiveEntry();
    if (!entry || !this._afterOpen) return nothing;

    const cfg = entry.after;
    const isNested = cfg.customKey === "nested";

    return html`
      <x-dbx-modal
        ?open=${this._afterOpen}
        title=${cfg.title ?? ""}
        subtitle=${cfg.subtitle ?? ""}
        panel-width=${cfg.panelWidth ?? ""}
        .dismissable=${cfg.dismissable ?? true}
        ?wide=${cfg.wide ?? false}
        primaryLabel=${cfg.primaryLabel ?? ""}
        primaryVariant=${cfg.primaryVariant ?? "primary"}
        cancelLabel=${cfg.cancelLabel ?? ""}
        footerLabel=${cfg.footerLabel ?? ""}
        footerVariant=${cfg.footerVariant ?? "primary"}
        @dbx-close=${this._handleAfterClose}
        @dbx-footer-click=${() => {
          if (isNested) return;
          this._closeAfter();
        }}
        @dbx-primary-click=${() => this._closeAfter()}
      >
        ${cfg.customKey ? this._renderAfterCustom(cfg.customKey) : nothing}
      </x-dbx-modal>

      ${isNested
        ? html`
            <x-dbx-modal
              ?open=${this._nestedChildOpen}
              title="Nested confirm"
              subtitle="Child dialog inside settings shell"
              primaryLabel="OK"
              cancelLabel="Cancel"
              @dbx-close=${() => {
                this._nestedChildOpen = false;
              }}
              @dbx-primary-click=${() => {
                this._nestedChildOpen = false;
              }}
            ></x-dbx-modal>
          `
        : nothing}
    `;
  }

  render() {
    const activeEntry = this._getActiveEntry();
    const showNestedTrigger =
      activeEntry?.after?.customKey === "nested" && this._afterOpen;

    return html`
      <div class="padded">
        <h1>Modal gallery</h1>
        <p class="intro">
          Temporary dev page for comparing legacy modals (before) with
          <code>x-dbx-modal</code> (after). Open one side at a time per row.
          Dismissable modals: X, Escape, and overlay click.
        </p>

        ${showNestedTrigger
          ? html`
              <sl-alert open variant="primary" style="margin-bottom:1.5em;">
                Parent modal is open —
                <sl-button size="small" @click=${() => (this._nestedChildOpen = true)}>
                  Open nested child
                </sl-button>
              </sl-alert>
            `
          : nothing}

        ${GALLERY_ENTRIES.map(
          (entry) => html`
            <section class="entry">
              <div class="entry-name">${entry.name}</div>
              <div class="compare">
                <div class="column before">
                  <div class="column-label">Before (existing)</div>
                  <sl-button size="small" @click=${() => this._openBefore(entry)}>
                    Open before
                  </sl-button>
                  <p class="note">${entry.beforeNote}</p>
                </div>
                <div class="column after">
                  <div class="column-label">After (x-dbx-modal)</div>
                  <sl-button
                    size="small"
                    variant="primary"
                    @click=${() => this._openAfter(entry)}
                  >
                    Open after
                  </sl-button>
                  <p class="note">${entry.afterNote}</p>
                </div>
              </div>
            </section>
          `,
        )}
      </div>

      ${this._renderAfterModal()}
    `;
  }
}

customElements.define("x-page-dev-modals", DevModalsPage);
