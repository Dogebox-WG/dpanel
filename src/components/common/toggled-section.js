import { css } from "/vendor/@lit/all@3.1.2/lit-all.min.js";

/* Classic "Advanced Settings" styling for shoelace sl-details
Use with sl-details by importing this chunk of css */

export const toggledSectionStyles = css`
  sl-details.advanced::part(base) {
    border: none;
    margin-bottom: 1em;
  }

  sl-details.advanced::part(header) {
    padding-left: 0;
    padding-right: 0;
    font-size: var(--sl-button-font-size-medium);
    color: var(--sl-color-primary-600);
  }

  sl-details.advanced::part(content) {
    border-left: 1px solid var(--sl-panel-border-color);
  }

  sl-details.advanced::part(summary) {
    flex: none;
    margin-right: 5px;
  }

  sl-details.advanced::part(summary-icon) {
    position: relative;
    top: 1px;
  }
`