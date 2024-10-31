import { LitElement, html, css } from "/vendor/@lit/all@3.1.2/lit-all.min.js";

class NotificationDot extends LitElement {
  static properties = {
    open: { type: Boolean, reflect: true }
  }
  render() {
    return html`<span class="dot"></span>`
  }
  static styles = css`
    :host {
      position: absolute;
      display: none;
      text-align: center;
      pointer-events: none;
    }
    :host([open]) {
      display: flex;
    }

    .dot {
      display: inline-block;
      width: 10px;
      height: 10px;
      border-radius: 10px;
      background: var(--sl-color-yellow-700);
      transform: translateX(var(--left, -33%)) translateY(var(--top, -66%));
    }
  `
}

customElements.define('x-dot', NotificationDot)