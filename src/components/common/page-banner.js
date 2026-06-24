import { LitElement, html, css, nothing } from '/lib/lit-all.js';

class PageBanner extends LitElement {

  static get properties() {
    return {
      title: { type: String },
      subtitle: { type: String },
      desc: { type: String },
    }
  }

  constructor() {
    super();
    this.title = "";
    this.subtitle = "";
    this.desc = ""
  }

  render() {
    return html`
      <div class="header">
        <h1>
          <span class="light">${this.title}</span><br/>
          ${this.subtitle}
        </h1>
        <slot></slot>
        <slot name="after"></slot>
      </div>
    `
  }

  static styles = css`
    .header {
      text-align: center;
      margin-bottom: 2em;
      user-select: none;

      h1 { 
        font-family: "Montserrat";
        font-weight: bold;
        line-height: 1;

        span.light {
          font-weight: 300;
          font-size: 1.4rem;
        }
      }

      ::slotted(p) {
        line-height: 1.4rem;
      }
    }
  `;
}

customElements.define('page-banner', PageBanner);