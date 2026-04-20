import { LitElement, html, css, nothing } from '/vendor/@lit/all@3.1.2/lit-all.min.js';

class TagSet extends LitElement {

  static get properties() {
    return {
      tags: { type: Object },
      max: { type: Number },
      highlight: { type: Boolean }
    }
  }

  render() {
    if (!this.tags || typeof this.tags !== 'object' || Object.keys(this.tags).length === 0) {
      return nothing;
    }

    const entries = Object.entries(this.tags);
    const displayCount = this.max || 3;
    const remainingCount = entries.length - displayCount;
    const remainingString = entries.slice(displayCount)
      .map(([key, value]) => `${key}:${value}`)
      .join(',\n');

    return html`
      ${entries.slice(0, displayCount).map(([key, value], index) => {
        const variant = (this.highlight && index === 0) ? 'success' : 'neutral';
        return html`
          <sl-tag size="medium" variant="${variant}">
            <span class="tag-key">${key}</span>:&nbsp;
            <span class="tag-value">${value}</span>
          </sl-tag>
        `;
      })}
      ${remainingCount > 0 ? html`
        <sl-tooltip content="${remainingString}">
          <sl-tag size="small" variant="neutral">+${remainingCount} more</sl-tag>
        </sl-tooltip>
      ` : ''}
    `;
  }

  static styles = css`
    :host {
      display: flex;
      flex-direction: row;
      flex-wrap: wrap;
      font-size: 0.7rem;
      align-items: center;
      gap: 0.25em;
      min-width: 300px;
      overflow: hidden;
    }

    .tag-key {
      max-width: 90px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      display: inline-block;
      vertical-align: bottom;
    }

    .tag-value {
      max-width: 120px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      display: inline-block;
      vertical-align: bottom;
    }

    sl-tag::part(base) {
      border:none;
      background-color: rgba(255, 255, 255, 0.1);
    }
  `
}

customElements.define('x-tag-set', TagSet);
