import { LitElement, html, css, unsafeCSS } from "/vendor/@lit/all@3.1.2/lit-all.min.js";

const DEFAULT_COLLAPSED_HEIGHT = "7em";

class RevealRow extends LitElement {
  static get properties() {
    return {
      label: { type: String },
      expanded: { type: Boolean },
      hasOverflow: { type: Boolean }
    };
  }

  static styles = css`
    :host {
      display: block;
      position: relative;
      line-height: 1.5rem;
      font-size: 1rem;
    }

    .wrap.has-more .collapsed {
      cursor: pointer;
    }

    .body-wrap {
      transition: max-height 0.2s ease-in-out;
      overflow: hidden;
      position: relative;
    }

    .collapsed {
      max-height: var(--reveal-collapsed-max-height, ${unsafeCSS(DEFAULT_COLLAPSED_HEIGHT)});
    }

    .expanded {
      max-height: none;
    }

    .shadow {
      position: absolute;
      bottom: 0px;
      left: 0;
      right: 0;
      height: 30px;
      background: linear-gradient(to bottom, transparent, rgba(35, 37, 42, 0.7));
      display: none;
    }

    .shadow.show {
      display: var(--shadow-display, block);
    }

    .footer {
      display: none;
      align-items: start;
      justify-content: center;
    }
    .footer.show {
      display: flex;
    }
    .footer .suffix {
      border-top: 1px solid rgb(51, 51, 51);
      margin-top: 1em;
      padding: 0em 2em;
      display: flex;
      justify-content: end;
    }
  `;

  constructor() {
    super();
    this.label = "";
    this.expanded = false;
    this.hasOverflow = false;
    this.handleResize = this.handleResize.bind(this);
  }

  connectedCallback() {
    super.connectedCallback();
    window.addEventListener("resize", this.handleResize);
  }

  disconnectedCallback() {
    window.removeEventListener("resize", this.handleResize);
    super.disconnectedCallback();
  }

  firstUpdated() {
    this.updateOverflowState();
  }

  handleResize() {
    this.updateOverflowState();
  }

  updateOverflowState() {
    const bodyWrap = this.shadowRoot.querySelector(".body-wrap");
    if (!bodyWrap) return;

    // Read the CSS variable incase it's been overridden, otherwise use the default.
    const collapsedMaxHeight = getComputedStyle(this)
      .getPropertyValue("--reveal-collapsed-max-height")
      .trim() || DEFAULT_COLLAPSED_HEIGHT;

    const previousMaxHeight = bodyWrap.style.maxHeight;
    bodyWrap.style.maxHeight = collapsedMaxHeight;
    this.hasOverflow = bodyWrap.scrollHeight > bodyWrap.clientHeight + 1;
    bodyWrap.style.maxHeight = previousMaxHeight  ;

    if (!this.hasOverflow && this.expanded) {
      this.performCollapse();
    }
  }

  performExpand() {
    this.expanded = true;
    this.style.setProperty('--shadow-display', 'none');
  }

  performCollapse() {
    this.expanded = false;
    this.style.setProperty('--shadow-display', 'block');
  }

  render() {
    const showToggle = this.hasOverflow;
    return html`
      <div class="wrap ${showToggle ? 'has-more' : ''}">
        <div part="body" @click=${showToggle ? this.performExpand : null} class="body-wrap ${this.expanded ? 'expanded' : 'collapsed'}">
          <slot @slotchange=${this.updateOverflowState}></slot>
          <div class="shadow ${showToggle ? 'show' : ''}"></div>
        </div>
        <div class="footer ${showToggle ? 'show' : ''}">
          <div class="suffix">
            <sl-button
              variant="text"
              class="toggle-button"
              @click=${() => this.expanded ? this.performCollapse() : this.performExpand() }
            >${this.expanded ? 'Show less' : 'Show more'}
            </sl-button>
          </div>
        </div>
      </div>
    `;
  }
}

customElements.define("reveal-row", RevealRow);