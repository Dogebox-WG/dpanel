import { LitElement, html, css } from '/lib/lit-all.js';

class DogeEgo extends LitElement {
  static properties = {}
  static styles = css`
    :host {
      display: block;
      background: #ffff0045;
      width: 120px;
      height: 80px;
    }
  `

  constructor() {
    super();
  }

  handleClick() {
    window.alert('clicky');
  }

  render() {
    return html`
      <h3 @click="${this.handleClick}">D0geRkt🚀</h3>
      `
  }
}

customElements.define('doge-ego', DogeEgo);


