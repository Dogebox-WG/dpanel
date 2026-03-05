import { LitElement, html, css } from '/vendor/@lit/all@3.1.2/lit-all.min.js';
import "/components/views/x-log-viewer/index.js";

class PageLogs extends LitElement {
  static styles = css`
    :host {
      display: block;
    }

    x-log-viewer {
      --log-viewer-height: calc(
        100vh - var(--page-header-height, 80px) - var(--log-footer-height, 80px)
      );
    }
  `;

  // TODO - import router and get the pupId from the route params
  // Rather than grabbing from URL.
  getPupIdFromUrl(url) {
    const parts = url.split('/');
    const pupsIndex = parts.indexOf('pups');
    if (pupsIndex !== -1 && parts.length > pupsIndex + 1) {
      return parts[pupsIndex + 1];
    }
    return null;
  }

  render() {
    return html`
      <x-log-viewer pupId=${this.getPupIdFromUrl(window.location.pathname)}></x-log-viewer>
    `;
  }
}

customElements.define('x-page-pup-logs', PageLogs);