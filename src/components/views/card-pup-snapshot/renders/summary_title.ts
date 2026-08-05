import { html, css } from '/lib/lit-all.js';
import type { PupSnapshot } from '../index.js';

export function renderSummaryTitle(this: PupSnapshot) {
  return html`
    <a href="/pups/${this.pupId.toLowerCase()}" @click=${this.handlePupTitleClick}>
      <span class="title">
        <sl-icon name="${this.icon}"></sl-icon>
        ${(this.pupName)}
      </span>
    </a>
    <span class="tags" ?hidden=${!this.version}>
      <sl-tag size="small" pill>${this.version}</sl-tag>
    </span>
    <span class="fade-tags ${this._dirty && !this._saved ? 'visible' : ''}">
      <sl-tag size="small" pill variant="warning">Unsaved Changes (${this._dirty})</sl-tag>
    </span>
    <span class="fade-tags ${this._saved ? 'visible' : ''}">
      <sl-tag size="small" pill variant="success">Saved</sl-tag>
    </span>
    <style>${summaryTitleStyles}</style>
  `;
}

const summaryTitleStyles = css`
  .title {
    display: flex;
    flex-direction: row;
    align-items: center;
    column-gap: 0.8em;
    text-transform: capitalize;
    opacity: 1;
  }
  .fade-tags {
    transition: opacity 300ms ease-in-out, visibility 300ms ease-in-out;
    opacity: 0;
    visibility: hidden;
    display: none;
  }
  .fade-tags.visible {
    opacity: 1;
    visibility: visible;
    display: inline-block;
  }
`;