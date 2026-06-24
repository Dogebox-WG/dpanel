import { LitElement, html, css } from "/lib/lit-all.js";
import { promptStyles } from "../styles.js";

export class BaseTask extends LitElement {
  close() {
    this.dispatchEvent(
      new CustomEvent("task-close-request", {
        detail: {},
        bubbles: true,
        composed: true,
      }),
    );
  }
}
