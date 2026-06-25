import { LitElement, html, css } from "/lib/lit-all.js";

class TextLoader extends LitElement {
  static get properties() {
    return {
      texts: { type: Array },
      endText: { type: String },
      loop: { type: Boolean },
      loopEnd: { type: Boolean },
    };
  }

  constructor() {
    super();
    this.texts = [];
    this.currentTextIndex = 0;
    this.loop = false;
    this.endText = "";
  }

  static styles = css`
    :host {
      font-family: inherit;
      font-size: inherit;
      display: block;
      height: 100%;
      width: 100%;
      min-width: 100px;
    }
    #text-container {
      display: flex;
      align-items: center;
      justify-content: flex-start;
      font-size: inherit;
      transition: opacity 300ms;
      opacity: 0;
    }
    #text-container.visible {
      opacity: 1;
    }
  `;

  render() {
    return html`
      <div id="text-container">
        <span id="animated-text"></span>
      </div>
    `;
  }

  updated(changedProperties) {
    if (changedProperties.has("texts")) {
      this.startAnimation();
    }
  }

  startAnimation() {
    const textElement = this.shadowRoot.getElementById("animated-text");
    const container = this.shadowRoot.getElementById("text-container");

    let count = 0;
    const updateText = () => {
      if (count === 0) {
        textElement.textContent = this.texts[this.currentTextIndex];
        container.classList.add("visible");
      }

      if (count !== 0) {
        textElement.textContent =
          this.texts[this.currentTextIndex] + ".".repeat(count % 4);
      }

      count++;

      if (this.loopEnd) {
        textElement.textContent = this.endText;
        container.classList.add("visible");
        return;
      }

      if (count === 4) {
        container.classList.remove("visible");
        setTimeout(() => {
          this.currentTextIndex =
            (this.currentTextIndex + 1) % this.texts.length;
          count = 0;
          if ((!this.loopEnd && this.loop) || this.currentTextIndex !== 0) {
            updateText(); // Continue or loop animation
          } else {
            // When no loop and all phrases are shown, display the endText
            textElement.textContent = this.endText;
            container.classList.add("visible");
          }
        }, 1100); // Wait for fade out before starting next text
      } else {
        setTimeout(updateText, 1200); // Update text every ..
      }
    };

    updateText();
  }
}

customElements.define("text-loader", TextLoader);

