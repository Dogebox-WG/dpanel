import {
  LitElement,
  html,
  css,
  nothing,
  classMap,
} from "/vendor/@lit/all@3.1.2/lit-all.min.js";

/**
 * Standard Dogebox modal wrapper around sl-dialog.
 *
 * Slots:
 *   custom — rich body content between header and actions
 *   (default) — aliases to custom when custom slot is empty
 *
 * Events:
 *   dbx-close — dismissed via X, Escape, overlay, or cancel
 *   dbx-primary-click — primary action button clicked
 *   dbx-footer-click — footer action button clicked
 */
export class DbxModal extends LitElement {
  static properties = {
    open: { type: Boolean, reflect: true },
    title: { type: String },
    subtitle: { type: String },
    dismissable: { type: Boolean, reflect: true },
    wide: { type: Boolean, reflect: true },
    panelWidth: { type: String, attribute: "panel-width" },
    primaryLabel: { type: String },
    primaryVariant: { type: String },
    primaryDisabled: { type: Boolean },
    primaryLoading: { type: Boolean },
    cancelLabel: { type: String },
    footerLabel: { type: String },
    footerVariant: { type: String },
    footerDisabled: { type: Boolean },
    footerLoading: { type: Boolean },
  };

  static styles = css`
    :host {
      display: block;
      --dbx-modal-panel-width: min(480px, 95vw);
    }

    sl-dialog::part(panel) {
      --width: var(--dbx-modal-panel-width);
    }

    sl-dialog.dbx-modal--wide::part(panel) {
      --width: 99vw;
    }

    @media (min-width: 576px) {
      sl-dialog.dbx-modal--wide::part(panel) {
        --width: 65vw;
      }
    }

    sl-dialog::part(body) {
      overflow: hidden;
      display: flex;
      flex-direction: column;
      min-height: 0;
    }

    .dbx-modal__body {
      display: flex;
      flex-direction: column;
      flex: 1;
      min-height: 0;
      overflow: hidden;
    }

    .dbx-modal__header {
      text-align: center;
      flex-shrink: 0;
    }

    .dbx-modal__title-row {
      display: grid;
      grid-template-columns: 1fr auto 1fr;
      align-items: start;
      width: 100%;
    }

    sl-dialog .dbx-modal__header h1.dbx-modal__title,
    h1.dbx-modal__title {
      display: block;
      grid-column: 1 / -1;
      grid-row: 1;
      margin: 0;
      padding: 0 3.25rem;
      box-sizing: border-box;
      width: 100%;
      text-align: center;
      font-family: "Comic Neue", sans-serif;
      font-weight: bold;
    }

    .dbx-modal__header > h1.dbx-modal__title {
      padding: 0;
    }

    .dbx-modal__close {
      grid-column: 3;
      grid-row: 1;
      justify-self: end;
      align-self: start;
    }

    .dbx-modal__subtitle {
      padding: 0 10%;
      margin: 0;
      text-align: center;
      line-height: 1.5;
    }

    .dbx-modal__header .dbx-modal__subtitle:first-of-type {
      padding-top: 1em;
    }

    .dbx-modal__header .dbx-modal__subtitle:last-of-type {
      padding-bottom: 1em;
    }

    .dbx-modal__header .dbx-modal__subtitle:not(:last-of-type) {
      margin-bottom: 0.75em;
    }

    .dbx-modal__custom:empty {
      display: none;
    }

    .dbx-modal__custom {
      flex: 1;
      min-height: 0;
      overflow-x: hidden;
      overflow-y: auto;
      /* sl-switch thumb translates left when unchecked; keep it inside the clip edge */
      padding-inline: var(--sl-spacing-small);
      box-sizing: border-box;
    }

    .dbx-modal__custom > * {
      min-width: 0;
      max-width: 100%;
      box-sizing: border-box;
    }

    .dbx-modal__primary-action {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.33em;
      width: 100%;
    }

    .dbx-modal__primary-action sl-button {
      width: 80%;
    }

    .dbx-modal__footer-action {
      display: flex;
      justify-content: flex-end;
      width: 100%;
    }
  `;

  constructor() {
    super();
    this.open = false;
    this.dismissable = true;
    this.primaryVariant = "primary";
    this.footerVariant = "primary";
  }

  connectedCallback() {
    super.connectedCallback();
    this._applyPanelWidth();
  }

  updated(changedProperties) {
    super.updated(changedProperties);
    if (changedProperties.has("panelWidth")) {
      this._applyPanelWidth();
    }
  }

  _applyPanelWidth() {
    this.style.setProperty(
      "--dbx-modal-panel-width",
      this.panelWidth ? this.panelWidth : "min(480px, 95vw)",
    );
  }

  _handleRequestClose(event) {
    if (!this.dismissable) {
      event.preventDefault();
      event.stopPropagation();
    }
  }

  _handleAfterHide() {
    this.open = false;
    this._emitClose("hide");
  }

  _emitClose(source) {
    this.dispatchEvent(
      new CustomEvent("dbx-close", {
        bubbles: true,
        composed: true,
        detail: { source },
      }),
    );
  }

  _handleCloseClick() {
    this.open = false;
  }

  _handlePrimaryClick() {
    this.dispatchEvent(
      new CustomEvent("dbx-primary-click", {
        bubbles: true,
        composed: true,
      }),
    );
  }

  _handleCancelClick() {
    this.open = false;
  }

  _handleFooterClick() {
    this.dispatchEvent(
      new CustomEvent("dbx-footer-click", {
        bubbles: true,
        composed: true,
      }),
    );
  }

  _renderSubtitle() {
    if (!this.subtitle) return nothing;

    return this.subtitle
      .split(/\n\n+/)
      .filter(Boolean)
      .map(
        (paragraph) =>
          html`<p class="dbx-modal__subtitle">${paragraph}</p>`,
      );
  }

  render() {
    const showPrimary = Boolean(this.primaryLabel);
    const showCancel = Boolean(this.cancelLabel);
    const showPrimaryBlock = showPrimary || showCancel;
    const showFooter = Boolean(this.footerLabel);
    const dialogClass = classMap({
      "dbx-modal--wide": this.wide,
    });

    return html`
      <sl-dialog
        label=${this.title || "Dialog"}
        ?open=${this.open}
        no-header
        class=${dialogClass}
        @sl-request-close=${this._handleRequestClose}
        @sl-after-hide=${this._handleAfterHide}
      >
        <div class="dbx-modal__body">
          ${this.title || this.subtitle
            ? html`
                <div class="dbx-modal__header">
                  ${this.title && this.dismissable
                    ? html`
                        <div class="dbx-modal__title-row">
                          <h1 class="dbx-modal__title">${this.title}</h1>
                          <sl-icon-button
                            class="dbx-modal__close"
                            name="x-lg"
                            label="Close"
                            @click=${this._handleCloseClick}
                          ></sl-icon-button>
                        </div>
                      `
                    : this.title
                      ? html`<h1 class="dbx-modal__title">${this.title}</h1>`
                      : nothing}
                  ${this._renderSubtitle()}
                </div>
              `
            : nothing}

          <div class="dbx-modal__custom">
            <slot name="custom"></slot>
            <slot></slot>
          </div>
        </div>

        ${showPrimaryBlock
          ? html`
              <div slot="footer" class="dbx-modal__primary-action">
                ${showPrimary
                  ? html`
                      <sl-button
                        variant=${this.primaryVariant}
                        ?disabled=${this.primaryDisabled}
                        ?loading=${this.primaryLoading}
                        @click=${this._handlePrimaryClick}
                      >
                        ${this.primaryLabel}
                      </sl-button>
                    `
                  : nothing}
                ${showCancel
                  ? html`
                      <sl-button variant="text" @click=${this._handleCancelClick}>
                        ${this.cancelLabel}
                      </sl-button>
                    `
                  : nothing}
              </div>
            `
          : nothing}

        ${showFooter
          ? html`
              <div slot="footer" class="dbx-modal__footer-action">
                <sl-button
                  variant=${this.footerVariant}
                  ?disabled=${this.footerDisabled}
                  ?loading=${this.footerLoading}
                  @click=${this._handleFooterClick}
                >
                  ${this.footerLabel}
                </sl-button>
              </div>
            `
          : nothing}
      </sl-dialog>
    `;
  }
}

customElements.define("x-dbx-modal", DbxModal);
