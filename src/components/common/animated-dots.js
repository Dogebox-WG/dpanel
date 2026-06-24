import { LitElement, html, css } from '/lib/lit-all.js';

class AnimatedDots extends LitElement {
  static styles = css`
    .ellipsis {
      color: inherit;
      display: inline-block;
      margin-left: 1px;
      overflow: hidden;
      vertical-align: bottom;
    }
    .dot {
      display: inline-block;
      opacity: 0;
      animation: fade 1.4s infinite;
    }
    .dot:nth-child(1) {
      animation-delay: -0.32s;
    }
    .dot:nth-child(2) {
      animation-delay: -0.16s;
    }
    @keyframes fade {
      0%, 100% {
        opacity: 0;
      }
      100% {
        opacity: 1;
      }
    }
  `;

  render() {
    return html`
      <div class="ellipsis">
        <span class="dot">.</span>
        <span class="dot">.</span>
        <span class="dot">.</span>
      </div>
    `;
  }
}

customElements.define('animated-dots', AnimatedDots);