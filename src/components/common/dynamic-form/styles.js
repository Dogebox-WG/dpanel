import { css } from "/vendor/@lit/all@3.1.2/lit-all.min.js";

export const styles = css`

  .loader-overlay {
    min-height: 240px;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  form {
    padding: 0em 0.5em;
  }
  form[data-mark-modified] {
    padding: 0em 1em;
  }

  /* Form tabs */
  sl-tab.capitalize::part(base) {
    text-transform: capitalize;
  }

  /* Form element spacing */
  .form-control {
    padding-bottom: 1.5em;
  }

  .form-control.no-margin {
    padding-bottom: 0em;
  }

  .form-control.breakline {
    border-bottom: 1px dashed var(--sl-input-border-color);
    margin-bottom: 1em;
  }

  /* Highlighting edits */
  form[data-mark-modified] [data-dirty-field] {
    position: relative;
  }
  form[data-mark-modified] [data-dirty-field]::part(form-control-label)::before,
  form[data-mark-modified] [data-dirty-field]::part(label)::before {
    content: "~";
    color: var(--sl-color-neutral-500);
    display: inline-block;
    position: absolute;
    left: -1em;
  }

  .tag-change-indicator {
    margin-left: 0.5em;
    display: none;
  }
  .tag-change-indicator[data-active] {
    display: inline-block;
  }

  @media (min-width: 680px) {
    .tag-change-indicator {
      display: inline-block;
      visibility: hidden;
    }
    .tag-change-indicator[data-active] {
      display: inline-block;
      visibility: visible;
    }
  }

  /* Footer buttons (submit, discard etc) */
  .footer-controls {
    display: flex;
    align-items: center;
    justify-content: var(--submit-btn-anchor, flex-end);
    gap: 0.75rem;
  }

  .footer-actions-end {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-left: auto;
  }

  .submit-success-state {
    display: inline-grid;
    place-items: center;
  }

  .submit-success-icon,
  .submit-success-placeholder {
    grid-area: 1 / 1;
  }

  .submit-success-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .submit-success-placeholder {
    visibility: hidden;
  }

  .footer-controls sl-button.discard-button::part(base) {
    color: var(--sl-color-neutral-700);
    text-decoration: underline;
  }
  .footer-controls sl-button.discard-button::part(base):hover {
    color: var(--sl-color-neutral-900);
  }

  /* Wider buttons on small screens unless overriden */
  sl-button:not([variant="text"]) {
    width: var(--submit-btn-width, 100%);
  }
  @media (min-width: 480px) {
    sl-button:not([variant="text"]) {
      width: var(--submit-btn-width, auto);
    }
  }

  /* Form Actions */
  sl-input,
  sl-select {
    position: relative;
  }

  .label-action {
    position: absolute;
    right: 0;
    top: 0;
    color: #8c8cff;
    text-align: right;
  }

  .label-action::part(label) {
    padding: 0;
    margin: 0;
  }

  .label-action::part(spinner) {
    left: auto;
    right: 3px;
    --indicator-color: #bbb;
  }
`;
