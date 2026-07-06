import { LitElement, html, css, nothing } from '/lib/lit-all.js';

class PageStack extends LitElement {

  static styles = css``;

  static properties = {}

  stack: unknown[];

  constructor() {
    super();
    this.stack = [];
  }

  render() {
    return html`
      <slot></slot>
    `
  }
}

customElements.define('page-stack', PageStack);
