import { LitElement, html, css, nothing } from "/vendor/@lit/all@3.1.2/lit-all.min.js";
import "/components/common/action-row/action-row.js";

class VersionCard extends LitElement {
  static properties = {
    name: { type: String },
    currentVersion: { type: String },
    newVersion: { type: String },
    short: { type: String },
    long: { type: String },
    link: { type: String },
    link_label: { type: String }
  }
  static styles = css`
    .short:empty, .long:empty, .link:empty {
      display: none;
    }

    .long {
      display: block;
    }

    .short { 
      display: block;
      max-width: 200px;
      text-overflow: ellipsis;
      overflow: hidden;
    }

    .label {
      display: flex;
      align-items: baseline;
      gap: 8px;
    }

    .link {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .link, .long {
      font-size: 0.8rem;
      margin-bottom: 4px;
      line-height: 1.5;
    }

    .fold { padding-left: 48px; }
  `
  render() {
    const { name, currentVersion, newVersion, short, long, link, link_label } = this;
    return html`
      <action-row prefix="box" expandable>
        <span class="label" slot="label">
          ${name} (${currentVersion} -> ${newVersion})
        </span>
        <sl-tooltip content=${short} hoist>
          <span class="short">${short}</span>
        </sl-tooltip>
        <div slot="hidden" class="fold">
          ${link ? html`
            <a href=${link} target="_blank" class="link">${link_label || link} <sl-icon name="box-arrow-up-right"></sl-icon></a>
          `: nothing }
          <span class="long">${long}</span>
        </div>
      </action-row>
    `
  }
}

customElements.define("x-version-card", VersionCard);