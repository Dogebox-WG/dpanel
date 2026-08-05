import { LitElement, html, css } from '/lib/lit-all.js';
import "/components/views/action-login/index.js";

class PageLogin extends LitElement {

  render() {
    return html`
      <x-action-login></x-action-login>
    `;
  }
}

customElements.define('x-page-login', PageLogin);