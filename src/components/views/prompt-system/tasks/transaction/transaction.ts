import { LitElement, html, css } from "/lib/lit-all.js";
import { BaseTask } from "../base-task.js";

class TransactionTask extends BaseTask {
  static styles = css`
    .review-container {
      background: rgba(0, 0, 0, 0.2);
      overflow-x: hidden;
      margin-bottom: 1.5em;
      box-sizing: border-box;
      padding: 1em;
      font-family: courier;
      width: 100%;
    }

    .review-element {
      margin-bottom: 1em;
      overflow-x: hidden;
      span.val {
        background: rgba(0, 0, 0, 0.2);
        display: block;
        overflow-x: auto;
      }
    }

    .label-wrap {
      display: flex;
      flex-direction: row;
      justify-content: space-between;
    }

    .copy {
      display: inline-block;
      font-size: 0.9rem;
      text-align: right;
      cursor: pointer;
      color: #00c3ff;
      text-decoration: underline;
    }

    .button-container {
      display: flex;
      gap: 1em;
      width: 100%;
      justify-content: center;
      align-items: center;
      color: var(--sl-color-warning-600);
    }
  `;
  render() {
    return html`
      <h3 class="title">
        <b>Tipjar</b> is requesting you to sign the following transaction:
      </h3>

      <div class="review-container">
        <div class="review-element">
          <div class="label-wrap">
            <label>Amount</label>
            <span class="copy">copy <sl-icon name="copy"></sl-icon></span>
          </div>
          <span class="val">Ð69,000</span>
        </div>

        <div class="review-element">
          <div class="label-wrap">
            <label>From</label>
            <span class="copy">copy <sl-icon name="copy"></sl-icon></span>
          </div>
          <span class="val">DH5yaieqoZN36fDVciNyRueRGvGLR3mr7L</span>
        </div>

        <div class="review-element">
          <div class="label-wrap">
            <label>To</label>
            <span class="copy">copy <sl-icon name="copy"></sl-icon></span>
          </div>
          <span class="val">DH5yaieqoZN36fDVciNyRueRGvGLR3mr7L</span>
        </div>
      </div>

      <div class="button-container">
        <sl-button variant="warning" size="large" @click=${this.close}
          >Reject</sl-button
        >
        <span>OR</span>
        <sl-button variant="warning" size="large" @click=${this.close}
          >Approve</sl-button
        >
      </div>
    `;
  }
}

customElements.define("task-transaction", TransactionTask);
