import { LitElement, html, css } from "/vendor/@lit/all@3.1.2/lit-all.min.js";
import { themes } from "/components/common/dynamic-form/themes.js";
import { store } from "/state/store.js";
import { postSetupBootstrap } from "/api/system/post-bootstrap.js";
import { asyncTimeout } from "/utils/timeout.js";
import { createAlert } from "/components/common/alert.js";

// Render chunks
import { renderBanner } from "./renders/banner.js";

class ActionSelectInstallPupCollection extends LitElement {
  static get properties() {
    return {
      pupCollections: { type: Array },
      selectedPupCollection: { type: String },
      open: { type: Boolean, reflect: true },
      onSuccess: { type: Function },
      _isLoading: { type: Boolean },
    };
  }

  static styles = [
    themes,
    css`
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

      .pup-collection-grid {
        display: flex;
        flex-direction: column;
        gap: 1em;
        margin-top: 1em;
        box-sizing: border-box;
      }

      .pup-collection-card {
        border: 1px solid var(--sl-panel-border-color);
        border-radius: var(--sl-border-radius-medium);
        padding: 1em;
        cursor: pointer;
        transition: all 0.2s ease;
        text-align: left;
        width: 100%;
        display: flex;
        align-items: center;
        gap: 1em;
        box-sizing: border-box;
      }

      .pup-collection-card:hover {
        border-color: var(--sl-color-primary-500);
        box-shadow: 0 0 0 1px var(--sl-color-primary-500);
      }

      .pup-collection-card.selected {
        border-color: var(--sl-color-primary-500);
        background-color: var(--sl-color-primary-50);
        box-shadow: 0 0 0 var(--sl-focus-ring-width) var(--sl-input-focus-ring-color);
      }

      .pup-collection-card:focus-visible {
        outline: none;
        border-color: var(--sl-color-primary-500);
        box-shadow: 0 0 0 var(--sl-focus-ring-width) var(--sl-input-focus-ring-color);
      }

      .pup-collection-icon {
        font-size: 2em;
        flex-shrink: 0;
      }

      .pup-collection-content {
        flex-grow: 1;
      }

      .pup-collection-name {
        font-family: "Comic Neue", sans-serif;
        font-weight: bold;
        font-size: 1.25em;
      }

      .pup-collection-description {
        font-size: 0.9em;
      }

      .next-button {
        margin-top: 2em;
      }
    `,
  ];

  constructor() {
    super();
    this._header = "Such Install"
    this.pupCollections = [
      {
        id: 'core',
        name: 'Core',
        description: 'Dogecoin Core, nothing else',
        icon: 'house'
      },
      {
        id: 'dogebox-experience',
        name: 'The Dogebox Experience',
        description: 'The full Dogebox experience including Core, Dogenet, Dogemap and Identity',
        icon: 'gear'
      },
      {
        id: 'custom',
        name: 'Custom Setup',
        description: 'No pups will be automatically installed. Build your own collection from scratch',
        icon: 'pencil'
      }
    ];
    this.selectedPupCollection = null;
    this.open = true;
    this._isLoading = false;
  }

  handlePupCollectionSelect(pupCollectionId) {
    this.selectedPupCollection = pupCollectionId;
    store.updateState({
      setupContext: {
        hasSelectedPupCollection: true,
        selectedPupCollection: pupCollectionId
      }
    });
  }

  async handleNext() {
    this._isLoading = true;
    
    try {
      // temp: also call our final initialisation API here.
      // TODO: move this into post-network flow.
      const finalSystemBootstrap = await postSetupBootstrap({
        initialSSHKey: store.setupContext['ssh-key'],
        // Temporarily don't submit reflectorToken until the service is up and running.
        reflectorToken: this.reflectorToken,
        reflectorHost: store.networkContext.reflectorHost
      }).catch(() => { console.log('bootstrap called but no response returned')});

      // Wait a bit for the network to settle
      await asyncTimeout(5000);

      // Update store to indicate we're done with this step
      store.updateState({
        setupContext: {
          ...store.setupContext,
          hasCompletedPupCollection: true
        }
      });

      if (this.onSuccess) {
        this.onSuccess();
      }
    } finally {
      this._isLoading = false;
    }
  }

  renderHeader = () => {
    return html`
      <div class="header-container">
        <h1>${this._header}</h1>
      </div>
    `;
  }

  render() {
    return html`
      <div class="page">
        <div class="padded">
          ${renderBanner()}
          <div class="pup-collection-grid">
            ${this.pupCollections.map(pupCollection => html`
              <div 
                class="pup-collection-card ${this.selectedPupCollection === pupCollection.id ? 'selected' : ''}"
                @click=${() => this.handlePupCollectionSelect(pupCollection.id)}
              >
                <sl-icon class="pup-collection-icon" name=${pupCollection.icon}></sl-icon>
                <div class="pup-collection-content">
                  <div class="pup-collection-name">${pupCollection.name}</div>
                  <div class="pup-collection-description">${pupCollection.description}</div>
                </div>
              </div>
            `)}
          </div>
          <div style="display: flex; justify-content: flex-end;">
            <sl-button 
              class="next-button"
              variant="primary"
              ?disabled=${!this.selectedPupCollection || this._isLoading}
              ?loading=${this._isLoading}
              @click=${this.handleNext}
            >
              Next
            </sl-button>
          </div>

          <div style="margin: 2em 8px">
            <sl-alert variant="warning" open>
              <sl-icon slot="icon" name="exclamation-triangle"></sl-icon>
              After you hit next it may take up to 10 minutes while your Dogebox is configured!
            </sl-alert>
          </div>
        </div>
      </div>
    `;
  }
}

customElements.define("x-action-select-install-pup-collection", ActionSelectInstallPupCollection); 