import { css } from "/lib/lit-all.js";

const pink = css`
  sl-button.pink[variant="text"]::part(label) {
    color: var(--sl-color-pink-600);
    cursor: pointer;
  }
  sl-button.pink:not([variant="text"])::part(base) {
    background-color: var(--sl-color-pink-500);
    border-color: var(--sl-color-pink-500);
  }
  sl-button.pink:is(:not([disabled], [loading], [variant="text"]))::part(
      base
    ):hover {
    background-color: var(--sl-color-pink-400);
    border-color: var(--sl-color-pink-400);
  }
  sl-button.pink:is(:not([disabled], [loading], [variant="text"]))::part(
      base
    ):active {
    background-color: var(--sl-color-pink-300);
    border-color: var(--sl-color-pink-300);
  }
`;

const yellow = css`
  sl-button.yellow[variant="text"]::part(label) {
    color: var(--sl-color-amber-600);
  }
  sl-button.yellow:not([variant="text"])::part(base) {
    background-color: var(--sl-color-amber-600);
    border-color: var(--sl-color-amber-600);
  }
  sl-button.yellow:is(:not([disabled], [loading], [variant="text"]))::part(
      base
    ):hover {
    background-color: var(--sl-color-amber-500);
    border-color: var(--sl-color-amber-500);
  }
  sl-button.yellow:is(:not([disabled], [loading], [variant="text"]))::part(
      base
    ):active {
    background-color: var(--sl-color-amber-400);
    border-color: var(--sl-color-amber-400);
  }
`;

const purple = css`
  sl-button.purple[variant="text"]::part(label) {
    color: var(--sl-color-purple-600);
  }
  sl-button.purple:not([variant="text"])::part(base) {
    background-color: var(--sl-color-purple-600);
    border-color: var(--sl-color-purple-600);
  }
  sl-button.purple:is(:not([disabled], [loading], [variant="text"]))::part(
      base
    ):hover {
    background-color: var(--sl-color-purple-500);
    border-color: var(--sl-color-purple-500);
  }
  sl-button.purple:is(:not([disabled], [loading], [variant="text"]))::part(
      base
    ):active {
    background-color: var(--sl-color-purple-400);
    border-color: var(--sl-color-purple-400);
  }
`;

export const themes = [pink, yellow, purple];
