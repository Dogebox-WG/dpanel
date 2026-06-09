import { LitElement, html, css, nothing } from '/vendor/@lit/all@3.1.2/lit-all.min.js';

class PupBuildBadge extends LitElement {
  static get properties() {
    return {
      manifest: { type: Object },
    };
  }

  get buildType() {
    const build = this.manifest?.container?.build;
    if (!build) return null;

    if (build.type === 'flake') return 'flake';
    if (build.type === 'nixFile' || build.nixFile) return 'legacy';
    return null;
  }

  render() {
    const buildType = this.buildType;
    if (!buildType) return nothing;

    const isFlake = buildType === 'flake';
    const label = isFlake ? 'Flake pup' : 'Legacy pup';
    const variant = isFlake ? 'primary' : 'warning';
    const icon = isFlake ? 'snow2' : 'box';
    const tooltip = isFlake
      ? 'This pup is packaged as a Nix flake.'
      : 'This pup still uses legacy pup.nix packaging.';

    return html`
      <sl-tooltip content=${tooltip}>
        <sl-tag size="small" pill variant=${variant}>
          <sl-icon name=${icon}></sl-icon>
          ${label}
        </sl-tag>
      </sl-tooltip>
    `;
  }

  static styles = css`
    :host {
      display: inline-flex;
      vertical-align: middle;
    }

    sl-tag {
      font-family: 'Comic Neue';
      font-weight: bold;
    }

    sl-icon {
      margin-right: 0.35em;
    }
  `;
}

customElements.define('pup-build-badge', PupBuildBadge);
