import { LitElement, html, css, nothing, classMap } from '/vendor/@lit/all@3.1.2/lit-all.min.js';
import { store } from "/state/store.js";
import { StoreSubscriber } from "/state/subscribe.js";
import { asyncTimeout } from "/utils/timeout.js";

class PageContainer extends LitElement {

  static styles = css`
    :host {
      display: block;
      position: relative;
      background: #1e232b;
      border-bottom: 1px solid #2c3138;
      min-height: 100%;
      box-sizing: border-box;
    }

    a, button {
      touch-action: manipulation;
    }

    :host(.transitioning) .page-header {
      width: 100%;
    }

    :host(.transitioning) .page-body {
      margin-top: 0px;
      position: relative;
      top: 80px;
    }

    .page-header {
      position: fixed;
      top: 0px;
      z-index: 99;
      height: 78px;
      width: calc(100% - var(--page-margin-left));
      background: #1e232b;
      box-sizing: border-box;
      border-bottom: 1px solid #21252e;
      box-shadow: 0 1px 0 #2c3138;

      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.5em;
      flex-direction: row;

      padding: 0em 1em;
      user-select: none;

      h2 {
        font-family: 'Comic Neue';
        text-transform: capitalize;
      }

      h2.alone {
        margin-left: 0.2em;
      }
    }

    .page-header section:first-child {
      flex: 1; /* To take up remaining space */

      display: flex;
      align-items: center;
      gap: 1em;
      flex-direction: row;
    }

    .page-header section:last-child {
      display: inline-block;
      text-align: right;
      width: 80px; /* Fixed width */

      @media (min-width: 576px) {
        display: none;
      }
    }

    .page-body {
      display: block;
      width: 100%;
      overflow: hidden;
      position: relative;
      margin-top: 80px;
    }
  `;

  static properties = {
    pageTitle: { type: String },
    pageAction: { type: String },
    previousPath: { type: String },
    upwardPath: { type: String },
    transitioning: { type: Boolean },
    router: { type: Object },
  }

  constructor() {
    super();
    this.pageTitle = "";
    this.pageAction = "";
    this.previousPath = "";
    this.upwardPath = "";
    this.transitioning = false;
    this.router = null;
    this.context = new StoreSubscriber(this, store)
  }

  firstUpdated() {
    setTimeout(() => {
      store.updateState({ appContext: { navigationDirection: "" }})
    }, 50);
  }

  async handleBackClick(e) {
    history.back();
  }

  handleMenuClick(e) {
    store.updateState({ appContext: { menuVisible: !store.appContext.menuVisible }})
    this.dispatchEvent(new CustomEvent('menu-toggle-request', {
      detail: {},
      composed: true,
      bubbles: true
    }));
  }

  selectActionIcon(action) {
    const actions = {
      back: "chevron-left",
      close: "x-lg"
    }
    return actions[action] || ""
  }

  render() {
    const { pageTitle, pageAction, handleBackClick, handleMenuClick } = this;
    const { updateAvailable } = store.getContext('sys');
    const showMenuDot = updateAvailable

    const pageActionEl = !pageAction ? nothing : html`
      <sl-button @click=${handleBackClick} variant="default" size="large" circle>
        <sl-icon name=${this.selectActionIcon(pageAction)} label="Back"></sl-icon>
      </sl-button>
    `

    const menuIconEl = html`
      <sl-icon-button
        @click=${handleMenuClick}
        name="list"
        label="menu"
        style="font-size: 2rem;"
      >
      </sl-icon>
    `

    return html`
      <div class="page-header">
        <section>
          ${pageActionEl}
          <h2 class="${pageAction ? "" : "alone"}">${pageTitle}</h2>
        </section>
        <section>
          <span style="position:relative; display: inline-block; height: 24px">
            <x-dot ?open=${showMenuDot} style="--top: 11px; --left: 28px"></x-dot>
            ${menuIconEl}
          </span>
        </section>
      </div>

      <div class="page-body">
        <slot></slot>
      </div>
      `
  }
}

function navigateBack(store, router) {
  // Retrieve path stack from the store
  const pathStack = store.appContext.pathStack;

  // Check if there is more than one path in the stack
  if (pathStack.length > 1) {
    // Remove the current path and get the previous path
    pathStack.pop();
    const previousPath = pathStack[pathStack.length - 1];

    // Update the store with the new path stack and navigate to the previous path
    store.updateState({
      appContext: {
        pathStack: pathStack
      }
    });
    return router.go(previousPath);
  }

  // If there is no previous path in the stack, navigate to the upwardPathname or root
  const destination = store.appContext.upwardPathname || "/";
  router.go(destination);
}

customElements.define('page-container', PageContainer);
