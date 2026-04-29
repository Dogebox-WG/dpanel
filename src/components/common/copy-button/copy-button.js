import { LitElement, html, css } from "/vendor/@lit/all@3.1.2/lit-all.min.js";
import { copyText } from "/utils/copy-text.js";

/**
 * Drop-in style replacement for sl-copy-button that works on HTTP (no secure context).
 * Dispatches the same sl-copy / sl-error events for compatibility.
 */
class XCopyButton extends LitElement {
  static properties = {
    value: {},
    disabled: { type: Boolean, reflect: true },
    hoist: { type: Boolean },
    feedbackDuration: { type: Number, attribute: "feedback-duration" },
    _status: { type: String, state: true },
    _tooltip: { type: String, state: true },
  };

  constructor() {
    super();
    this.value = "";
    this.disabled = false;
    this.hoist = false;
    this.feedbackDuration = 1000;
    this._status = "rest";
    this._tooltip = "Copy";
    this._resetTimer = null;
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this._resetTimer) {
      clearTimeout(this._resetTimer);
      this._resetTimer = null;
    }
  }

  _valueToString() {
    const v = this.value;
    if (v == null) return "";
    if (typeof v === "string") return v;
    if (Array.isArray(v)) return v.join(",");
    return String(v);
  }

  _scheduleReset() {
    if (this._resetTimer) clearTimeout(this._resetTimer);
    this._resetTimer = window.setTimeout(() => {
      this._status = "rest";
      this._tooltip = "Copy";
      this._resetTimer = null;
    }, this.feedbackDuration);
  }

  async handleClick(e) {
    e.stopPropagation();
    if (this.disabled) return;
    await this.copy();
  }

  /** Same behavior as a user click; useful for programmatic copy. */
  async copy() {
    if (this.disabled) return;
    const text = this._valueToString();
    if (!text) {
      this._status = "error";
      this._tooltip = "Nothing to copy";
      this._scheduleReset();
      this.dispatchEvent(
        new CustomEvent("sl-error", { bubbles: true, composed: true }),
      );
      return;
    }
    try {
      await copyText(text);
      this._status = "success";
      this._tooltip = "Copied";
      this._scheduleReset();
      this.dispatchEvent(
        new CustomEvent("sl-copy", {
          bubbles: true,
          composed: true,
          detail: { value: text },
        }),
      );
    } catch {
      this._status = "error";
      this._tooltip = "Copy failed";
      this._scheduleReset();
      this.dispatchEvent(
        new CustomEvent("sl-error", { bubbles: true, composed: true }),
      );
    }
  }

  render() {
    return html`
      <sl-tooltip
        content=${this._tooltip}
        placement="top"
        ?hoist=${this.hoist}
        ?disabled=${this.disabled}
      >
        <button
          part="button"
          type="button"
          class="x-copy-btn ${this._status === "success"
            ? "x-copy-btn--success"
            : this._status === "error"
              ? "x-copy-btn--error"
              : ""}"
          ?disabled=${this.disabled}
          @click=${this.handleClick}
        >
          <span class="icon-slot" ?hidden=${this._status !== "rest"}>
            <slot name="copy-icon">
              <sl-icon name="copy"></sl-icon>
            </slot>
          </span>
          <span class="icon-slot" ?hidden=${this._status !== "success"}>
            <slot name="success-icon">
              <sl-icon name="check-lg"></sl-icon>
            </slot>
          </span>
          <span class="icon-slot" ?hidden=${this._status !== "error"}>
            <slot name="error-icon">
              <sl-icon name="x-lg"></sl-icon>
            </slot>
          </span>
        </button>
      </sl-tooltip>
    `;
  }

  static styles = css`
    .x-copy-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      box-sizing: border-box;
      border: none;
      border-radius: var(--sl-border-radius-medium);
      padding: var(--sl-spacing-x-small);
      font: inherit;
      color: var(--sl-color-neutral-600);
      background: transparent;
      cursor: pointer;
      min-height: calc(var(--sl-spacing-medium) * 2 + 16px);
      min-width: calc(var(--sl-spacing-medium) * 2 + 16px);
    }
    .x-copy-btn:hover:not(:disabled) {
      color: var(--sl-color-primary-600);
    }
    .x-copy-btn:focus-visible {
      outline: var(--sl-focus-ring);
      outline-offset: var(--sl-focus-ring-offset);
    }
    .x-copy-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .x-copy-btn--success {
      color: var(--sl-color-success-600);
    }
    .x-copy-btn--error {
      color: var(--sl-color-danger-600);
    }
    .icon-slot {
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
    .icon-slot[hidden] {
      display: none;
    }
  `;
}

customElements.define("x-copy-button", XCopyButton);
