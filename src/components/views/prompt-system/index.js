import {
  LitElement,
  html,
  choose,
} from "/lib/lit-all.js";
import { promptStyles } from "./styles.js";
import { store } from "/state/store.js";
import "./tasks/index.js";

class SystemPrompt extends LitElement {
  static styles = [promptStyles];
  static properties = {
    open: { type: Boolean, reflect: true },
    task: { type: String },
    showExplainerDialog: { type: Boolean },
  };

  connectedCallback() {
    super.connectedCallback();
    this.addEventListener("task-close-request", (e) =>
      this.handleTaskCloseRequest(e),
    );
  }

  constructor() {
    super();
    this.open = false;
    this.task = "";
  }

  disconnectedCallback() {
    this.removeEventListener("task-close-request", (e) =>
      this.handleTaskCloseRequest(e),
    );
    this.addEventListener("sl-open");
    super.disconnectedCallback();
  }

  handleTaskCloseRequest(event) {
    this.close();
    event.stopPropagation();
  }

  handleWhyClick() {
    this.shadowRoot.querySelector("sl-dialog").show();
  }

  close() {
    // Animate host (fade)
    this.style.animation = "fadeOut 0.2s ease-in forwards";
    this.style.animationDelay = "100ms";
    // Animate panel (slide)
    const innerEl = this.shadowRoot.querySelector(".inner");
    innerEl.style.animation = "slideOut 0.3s ease-in forwards";

    setTimeout(() => {
      // Reset host animations;
      this.style.animation = "fadeIn 0.3s ease-out forwards";
      this.style.animationDelay = "0";
      // Reset panel animations;
      innerEl.style.animation = "slideIn 350ms ease-out forwards";

      // Update central store
      store.updateState({
        promptContext: {
          display: false,
          type: null,
        },
      });
    }, 500);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
  }

  render() {
    return html`
      <div class="outer">
        <div class="inner">
          <div class="heading-container">
            <div class="more-container">
              <hr />
              <a href="#" @click=${this.handleWhyClick}
                >Why am I seeing this?
                <sl-icon name="info-circle-fill"></sl-icon
              ></a>
            </div>
          </div>
          <div class="content-container">
            <div class="task-container">
              ${choose(
                this.task,
                [
                  [
                    "transaction",
                    () => html`<task-transaction></task-transaction>`,
                  ],
                  [
                    "verify-txn",
                    () =>
                      html`<task-verify-transaction></task-verify-transaction>`,
                  ],
                ],
                () => html`
                  <pre>No task matching name: ${this.task}</pre>
                  <sl-button variant="warning" @click=${this.close}
                    >Close</sl-button
                  >
                `,
              )}
              <div class="more-container mobile">
                <hr />
                <a href="#" @click=${this.handleWhyClick}
                  >Why am I seeing this?
                  <sl-icon name="info-circle-fill"></sl-icon
                ></a>
              </div>

              <sl-dialog label="User consent prompt">
                <span>TODO :: Write a helpful explanation</span>
              </sl-dialog>
            </div>
          </div>
        </div>
      </div>
    `;
  }
}

customElements.define("system-prompt", SystemPrompt);
