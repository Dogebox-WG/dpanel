import { LitElement, html, css, nothing } from "/vendor/@lit/all@3.1.2/lit-all.min.js";

export class ConfirmationPrompt extends LitElement {
  static get properties() {
    return {
      title: { type: String },
      description: { type: String },
      topButtonText: { type: String },
      topButtonVariant: { type: String },
      topButtonClick: { type: Function },
      bottomButtonText: { type: String },
      bottomButtonVariant: { type: String },
      bottomButtonClick: { type: Function },
    }
  }

  static styles = css`
    p { 
      padding: 2em 10%;
    }
    .footer {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: .33em;
    }
    .footer sl-button { 
      width: 80%;
    }
  `

  constructor() {
    super();

    this.title = this.title ?? 'Are you sure?'
    this.topButtonVariant = this.topButtonVariant ?? 'primary'
    this.bottomButtonVariant = this.bottomButtonVariant ?? 'text'

    this._bottomButtonClick = () => {
      if (this.bottomButtonClick) this.bottomButtonClick()
    }

    this._topButtonClick = () => {
      if (this.topButtonClick) this.topButtonClick()
    }
  }

  render() {
    return html`
      <div style="text-align: center;">
        <h3>${this.title}</h3>
        <p>${this.description}</p>
      </div>
      <div class="footer" slot="footer">
        <sl-button variant="${this.topButtonVariant}" @click=${this._topButtonClick}>${this.topButtonText}</sl-button>
        <sl-button variant="${this.bottomButtonVariant}" @click=${this._bottomButtonClick}>${this.bottomButtonText}</sl-button>
      </div>
    `;
  }
}

customElements.define("x-confirmation-prompt", ConfirmationPrompt);