import { LitElement, html, css } from '/lib/lit-all.js';

class PaginatorUI extends LitElement {
  static get properties() {
    return {
      currentPage: { type: Number },
      totalPages: { type: Number },
      onNext: { type: Object },
      onPrev: { type: Object },
      disabled: { type: Boolean },
    };
  }

  static get styles() {
    return css`
      .paginator {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        padding: 16px 0px;
        font-size: 1rem;
        font-family: 'Comic Neue', sans-serif;
        font-weight: 700;
      }

      .page-button {
        margin: 0 8px;
        cursor: pointer;
      }

      .page-button[disabled] {
        cursor: default;
        opacity: 0.5;
      }

      .page-counter[disabled] {
        opacity: 1;
      }
    `;
  }

  constructor() {
    super();
    this.currentPage = 1;
    this.totalPages = 1;
  }

  render() {
    return html`
      <div class="paginator">
        <sl-button
          class="page-button"
          @click=${this.handlePrevious}
          ?disabled=${this.disabled || this.currentPage <= 1}
        >
          Previous
        </sl-button>
        <span class="page-counter" ?disabled=${this.disabled}>
          Page ${this.currentPage} of ${this.totalPages}
        </span>
        <sl-button
          class="page-button"
          @click=${this.handleNext}
          ?disabled=${this.disabled || this.currentPage >= this.totalPages}
        >
          Next
        </sl-button>
      </div>
    `;
  }

  handlePrevious() {
    this.dispatchEvent(new CustomEvent('go-prev', { detail: {} }));
  }

  handleNext() {
    this.dispatchEvent(new CustomEvent('go-next', { detail: {} }));
  }
}

customElements.define('paginator-ui', PaginatorUI);