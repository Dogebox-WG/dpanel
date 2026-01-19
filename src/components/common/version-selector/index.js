import {
  LitElement,
  html,
  css,
} from "/vendor/@lit/all@3.1.2/lit-all.min.js";

/**
 * Version Selector Component
 * A reusable dropdown for selecting versions with automatic "latest" marking
 */
class VersionSelector extends LitElement {
  static get properties() {
    return {
      versions: { type: Array },
      selectedVersion: { type: String },
      latestVersion: { type: String },
      disabled: { type: Boolean },
      size: { type: String },
      placeholder: { type: String },
    };
  }

  constructor() {
    super();
    this.versions = [];
    this.selectedVersion = '';
    this.latestVersion = '';
    this.disabled = false;
    this.size = 'small';
    this.placeholder = 'Select version';
  }

  // Prevent sl-hide from bubbling up and closing parent dialogs
  firstUpdated() {
    this.addEventListener("sl-hide", this._handleHide);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener("sl-hide", this._handleHide);
  }

  _handleHide(e) {
    e.stopPropagation();
  }

  _handleChange(e) {
    const value = e.target.value;
    this.dispatchEvent(new CustomEvent('version-change', {
      detail: { version: value },
      bubbles: true,
      composed: true
    }));
  }

  /**
   * Get version string from version item (handles both string and object)
   */
  _getVersionString(version) {
    return typeof version === 'string' ? version : version.version;
  }

  render() {
    return html`
      <sl-select 
        value=${this.selectedVersion}
        @sl-change=${this._handleChange}
        size=${this.size}
        placeholder=${this.placeholder}
        ?disabled=${this.disabled}
        class="version-select"
      >
        ${this.versions.map((v, i) => {
          const versionString = this._getVersionString(v);
          const isLatest = this.latestVersion 
            ? versionString === this.latestVersion 
            : i === 0;
          
          return html`
            <sl-option value=${versionString}>
              ${versionString}${isLatest ? ' (latest)' : ''}
            </sl-option>
          `;
        })}
      </sl-select>
    `;
  }

  static styles = css`
    :host {
      display: inline-block;
    }

    .version-select {
      width: 100%;
    }
  `;
}

customElements.define("version-selector", VersionSelector);

