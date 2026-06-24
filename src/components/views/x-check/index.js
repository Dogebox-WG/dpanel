import { LitElement, html, css } from "/lib/lit-all.js";
import "/components/common/action-row/action-row.js";

class HealthCheck extends LitElement {
  static get properties() {
    return {
      status: { type: String },
      check: { type: Object },
      disabled: { type: Boolean }
    };
  }

  constructor() {
    super();
    this.check = {};
    this.status = "loading";
    this.disabled = false;
  }

  determine(status) {
    let prefix = "";
    let variant = "";

    if (this.disabled) {
      status = "disabled"
    }

    switch (status) {
      case "disabled":
        return {
          prefix: "pause-circle",
          variant: "neutral",
        };
      case "success":
        return {
          prefix: "check2",
          variant: "success",
        };
        break;
      case "error":
        return {
          prefix: "x-lg",
          variant: "danger",
        };
        break;
      case "warning":
        return {
          prefix: "exclamation-triangle",
          variant: "warning",
        };
        break;
      case "loading":
        return {
          prefix: "arrow",
          variant: "primary",
        };
        break;
      default: {
        return {
          prefix: "question-circle",
          variant: "",
        };
      }
    }
  }

  render() {
    const check = this.check;

    return html`
      <action-row
        name="${check.name}"
        label="${check.label}"
        prefix=${this.determine(this.status).prefix}
        variant=${this.determine(this.status).variant}
        ?loading=${!this.disabled && this.status === "loading"}
        ?disabled=${this.disabled}
      >
        ${check.description}
      </action-row>
    `;
  }
}

customElements.define("health-check", HealthCheck);
