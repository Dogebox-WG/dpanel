import { LitElement, html, css, nothing } from '/vendor/@lit/all@3.1.2/lit-all.min.js';

class PageBanner extends LitElement {

  static get properties() {
    return {
      title: { type: String },
      subtitle: { type: String },
      desc: { type: String },
      _hasImage: { type: Boolean, state: true },
    }
  }

  constructor() {
    super();
    this.title = "";
    this.subtitle = "";
    this.desc = ""
    this._hasImage = false;
  }

  handleImageSlotChange(event) {
    const hasImage = event.target.assignedElements({ flatten: true }).length > 0;
    if (hasImage !== this._hasImage) {
      this._hasImage = hasImage;
    }
  }

  render() {
    return html`
      <div class="header">
        <div class="title-wrap ${this._hasImage ? 'has-image' : 'no-image'}">
          <slot name="image" @slotchange=${this.handleImageSlotChange}></slot>
          <h1>
            <span class="light">${this.title}</span><br/>
            ${this.subtitle}
          </h1>
        </div>
        <slot></slot>
        <slot name="after"></slot>
      </div>
    `
  }

  static styles = css`
    .header {
      color: #C6C5D0;
      text-align: center;
      margin-bottom: 2em;
      user-select: none;

      .title-wrap {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 1rem;
        width: fit-content;
        margin-left: auto;
        margin-right: auto;
      }

      .title-wrap.no-image {
        width: 100%;
      }

      .title-wrap.has-image h1 {
        text-align: left;
      }

      h1 { 
        font-family: "Montserrat";
        font-weight: bold;
        line-height: 1;
        margin: 0;
        text-align: center;

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