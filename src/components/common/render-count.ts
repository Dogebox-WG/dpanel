import { LitElement, html } from '/lib/lit-all.js';

class RenderCount extends LitElement {
  static properties = {
    message: { type: String, reflect: true }
  }

  renderCount: number;
  declare message: string;

  constructor() {
    super();
    this.renderCount = 0;
    this.message = "";
  }

  render() {
    this.renderCount += 1;
    return html`
      <span class="debug-render-count">${this.renderCount}</span>
      `
  }
}

customElements.define('render-count', RenderCount);


