import { css } from "/vendor/@lit/all@3.1.2/lit-all.min.js";

export const createKeyStyles = css`
  :host {
    display: block;
  }
  .page {
    display: flex;
    align-self: center;
    justify-content: center;
    padding-bottom: 1em;
  }
  .padded {
    width: 100%;
    margin: 0em 0em;
  }
  h1 {
    font-family: "Comic Neue", sans-serif;
  }

  .avoidwrap {
    display: inline-block;
  }

  .phrase-wrap {
    width: 100%;
    position: relative;
    border-radius: 1em;
    border: 1px solid var(--sl-panel-border-color);
    margin: 0em auto 0em auto;
    box-sizing: border-box;
  }

  .phrase-wrap .phrase-underlay {
    position: absolute;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.1);
    border-radius: 1em;
    z-index: 1;
  }

  .phrase-wrap .phrase-overlay {
    position: absolute;
    width: 100%;
    height: 100%;
    z-index: 2;
    display: flex;
    flex-direction: column;
    gap: 0.2em;
    align-items: center;
    justify-content: center;
    border-radius: 1em;
  }

  .phrase-wrap .phrase-overlay.hidden {
    display: none;
  }

  .phrase-overlay .text {
    padding: 0.5em;
    text-align: center;
  }

  .phrase-grid {
    display: grid;
    opacity: 1;
    grid-template-columns: repeat(2, 1fr);
    @media (min-width: 576px) {
      grid-template-columns: repeat(3, 1fr);
    }
    gap: var(--sl-spacing-small);

    max-width: 100%;

    padding: 1em;
    border-radius: 1em;
    background: var(--sl-panel-background-color);
  }

  .phrase-grid sl-tag {
    justify-self: center;
    width: 100%;
    position: relative;
  }

  .phrase-grid sl-tag::part(base) {
    justify-content: center;
  }

  .phrase-grid:not(.blur) sl-tag::part(base) {
    user-select: text;
    -webkit-user-select: text;
  }

  .phrase-grid sl-tag span.order {
    color: var(--sl-color-neutral-400);
    position: absolute;
    left: 1rem;
    user-select: none;
    -webkit-user-select: none;
  }

  .phrase-grid.blur sl-tag span.term {
    color: transparent;
    text-shadow: 1px 1px 10px rgba(255, 255, 255, 0.8);
  }

  .phrase-actions {
    display: flex;
    flex-direction: row;
    width: 100%;
    justify-content: space-between;
  }

  /* Card */
  .key-wrap.empty sl-card::part(base) {
    border: 1px dashed var(--sl-panel-border-color);
    background-color: var(--sl-color-neutral-0);
  }

  .key-wrap.active .card-footer::part(footer) {
    color: unset;
  }
  .key-wrap .card-footer {
    width: 100%;
    padding: 0em;
    margin-bottom: 1em;

    &::part(body) {
      display: flex;
      padding: 0.5em var(--padding) 1em var(--padding);
      flex-direction: column;
      gap: 0.45em;
    }

    &::part(footer) {
      color: var(--sl-color-neutral-300);
      padding: 0.4em var(--padding);
    }

    .title-wrap {
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: space-between;
      gap: 1em;

      span {
        font-family: "Comic Neue";
        font-weight: bold;
      }

      span.actions {
        margin-right: -0.5em;
      }
    }
  }

  .card-footer [slot="footer"] {
    padding: 0em;
    font-size: 0.9rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  #KeyGenDialog {
    --width: calc(31rem + 15%);
    .inner {
      min-height: 300px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-direction: column;
    }
  }

  #KeyGenDialog .central-spinner {
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .phraseFooter {
    display: flex;
    flex-direction: column;
    justify-content: center;
    width: 100%;
  }
  .phraseProceedActions {
    display: flex;
    flex-direction: column;
    justify-content: center;
    width: 100%;
    gap: 1em;
  }

  ._phraseProceedActions {
    .sl-checkbox[checked]::part(control) {
      border-color: var(--sl-color-success-600);
    }
    sl-checkbox[checked]::part(label) {
      color: var(--sl-color-success-700);
    }
    sl-checkbox[checked]::part(control) {
      background-color: var(--sl-color-success-600);
      outline: none;
    }
    sl-checkbox:focus-within[checked]::part(control) {
      border-color: var(--sl-color-success-600);
      box-shadow: 0 0 0 var(--sl-focus-ring-width) var(--sl-color-success-300);
    }
  }
`;
