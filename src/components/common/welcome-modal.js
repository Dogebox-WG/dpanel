import { html, nothing } from "/vendor/@lit/all@3.1.2/lit-all.min.js";
import { LitElement, css } from "/vendor/@lit/all@3.1.2/lit-all.min.js";
import { postWelcomeComplete } from "/api/system/post-welcome-complete.js";
import { postInstallPupCollection } from "/api/system/post-install-pup-collection.js";

class WelcomeModal extends LitElement {
  static styles = css`
    :host {
      display: block;
    }
    sl-dialog::part(panel) {
      width: 600px;
    }
    .welcome-content {
      text-align: center;
      padding: 1em;
    }
    .modal-title {
      font-family: "Comic Neue", sans-serif;
      font-size: 2em;
      font-weight: bold;
      margin-bottom: 1em;
      color: var(--sl-color-neutral-900);
    }
    .intro-text {
      margin-bottom: 2em;
      line-height: 1.5;
    }
    .card-grid {
      display: flex;
      flex-direction: column;
      gap: 1em;
      margin: 2em 0;
    }
    .card {
      min-height: 150px;
      height: auto;
      width: 100%;
      background: var(--sl-panel-background-color);
      border: 1px solid var(--sl-panel-border-color);
      border-radius: var(--sl-border-radius-medium);
      padding: 1em;
      box-sizing: border-box;
      display: flex;
      flex-direction: row;
      align-items: flex-start;
      gap: 1.5em;
      cursor: pointer;
      transition: all 0.2s ease;
      position: relative;
    }
    .card:hover {
      border-color: var(--sl-color-primary-500);
      box-shadow: 0 0 0 1px var(--sl-color-primary-500);
    }
    .card.selected {
      border-color: var(--sl-color-primary-500);
      background-color: var(--sl-color-primary-50);
      box-shadow: 0 0 0 var(--sl-focus-ring-width) var(--sl-input-focus-ring-color);
    }
    .card-header {
      display: flex;
      flex-direction: row;
      align-items: flex-start;
      gap: 1.5em;
      width: 100%;
    }
    .card-image {
      width: 120px;
      height: 120px;
      min-width: 120px;
      flex-shrink: 0;
      background-size: cover;
      background-position: center;
      border-radius: var(--sl-border-radius-small);
    }

    @media (max-width: 640px) {
      .card-image {
        width: 100px;
        height: 100px;
        min-width: 100px;
      }
    }
    .card-content {
      flex-grow: 1;
      text-align: left;
    }
    .card-title {
      font-family: "Comic Neue", sans-serif;
      font-size: 1.5em;
      font-weight: bold;
      margin: 0 0 0.5em 0;
    }
    .card-subtitle {
      font-size: 0.9em;
      color: var(--sl-color-neutral-600);
      line-height: 1.4;
    }
    .core-image {
      background-image: url('/static/img/pup-collection-core.png');
    }
    .essentials-image {
      background-image: url('/static/img/pup-collection-essentials.png');
    }
    .custom-image {
      background-image: url('/static/img/pup-collection-custom.png');
    }
    .footer {
      display: flex;
      justify-content: flex-end;
      gap: 1em;
    }
    .installing-content {
      text-align: center;
      padding: 2em;
    }
    .installing-image {
      width: 150px;
      height: 150px;
      margin: 0 auto 2em;
      background-image: url('/static/img/celebrate.png');
      background-size: contain;
      background-position: center;
      background-repeat: no-repeat;
    }
    .installing-text {
      font-size: 1.2em;
      color: var(--sl-color-neutral-700);
      line-height: 1.5;
      margin-bottom: 2em;
    }
    .recommended-label {
      position: absolute;
      top: 0.5em;
      right: 0.5em;
      background-color: #FFD700;
      color: #000000;
      padding: 0.25em 0.75em;
      border-radius: var(--sl-border-radius-small);
      font-size: 0.8em;
      font-weight: bold;
    }
  `;

  static get properties() {
    return {
      open: { type: Boolean },
      onClose: { type: Function },
      selectedOption: { type: String },
      isInstalling: { type: Boolean }
    };
  }

  constructor() {
    super();
    this.open = false;
    this.onClose = () => {};
    this.selectedOption = null;
    this.isInstalling = false;
  }

  firstUpdated() {
    // Prevent closing when clicking outside
    const dialog = this.shadowRoot.querySelector('sl-dialog');
    dialog.addEventListener('sl-request-close', (event) => {
      if (event.detail.source === 'overlay') {
        event.preventDefault();
      }
    });
  }

  async handleNext() {
    try {
      await postWelcomeComplete();
      
      if (this.selectedOption !== 'custom') {
        await postInstallPupCollection(this.selectedOption);
      }
      
      this.onClose();
    } catch (err) {
      console.warn('Failed to mark welcome as complete:', err);
    }
  }

  handleOptionSelect(option) {
    this.selectedOption = option;
  }

  render() {
    if (!this.open) return nothing;

    if (this.isInstalling) {
      return html`
        <sl-dialog 
          label="Welcome to Dogebox"
          ?open=${this.open}
          @sl-hide=${this.onClose}
          no-header
        >
          <div class="installing-content">
            <div class="installing-image"></div>
            <div class="installing-text">
              Your pups are now being installed in the background.<br>Navigate to the pup page to see progress
            </div>
            <div class="footer">
              <sl-button variant="primary" @click=${this.onClose}>
                Done
              </sl-button>
            </div>
          </div>
        </sl-dialog>
      `;
    }

    return html`
      <sl-dialog 
        label="Welcome to Dogebox"
        ?open=${this.open}
        @sl-hide=${this.onClose}
        no-header
      >
        <div class="welcome-content">
          <div class="modal-title">Welcome to Dogebox</div>
          <div class="intro-text">
            <p>Since this may be your first time here, we can offer some help to get you setup quickly.</p>
            <p>Please select one of the following Pup Collections you'd like to have automatically installed on your Dogebox.</p>
          </div>

            <div class="card ${this.selectedOption === 'essentials' ? 'selected' : ''}"
                 @click=${() => this.handleOptionSelect('essentials')}>
              <div class="recommended-label">Recommended</div>
              <div class="card-header">
                <div class="card-image essentials-image"></div>
                <div class="card-content">
                  <div class="card-title">Essentials</div>
                  <div class="card-subtitle">Gets you up and running with Dogecoin Core, Dogenet, DogeMap, Identity</div>
                </div>
              </div>
            </div>

          <div class="card-grid">
            <div class="card ${this.selectedOption === 'core' ? 'selected' : ''}" 
                 @click=${() => this.handleOptionSelect('core')}>
              <div class="card-header">
                <div class="card-image core-image"></div>
                <div class="card-content">
                  <div class="card-title">Core Only</div>
                  <div class="card-subtitle">Nothing but Dogecoin Core</div>
                </div>
              </div>
            </div>

            <div class="card ${this.selectedOption === 'custom' ? 'selected' : ''}"
                 @click=${() => this.handleOptionSelect('custom')}>
              <div class="card-header">
                <div class="card-image custom-image"></div>
                <div class="card-content">
                  <div class="card-title">Custom</div>
                  <div class="card-subtitle">Choose your own adventure.  No preinstalled pups</div>
                </div>
              </div>
            </div>
          </div>

          <div class="footer" slot="footer">
            <sl-button variant="primary" 
                      @click=${this.handleNext}
                      ?disabled=${!this.selectedOption}>
              Next
            </sl-button>
          </div>
        </div>
      </sl-dialog>
    `;
  }
}

customElements.define('x-welcome-modal', WelcomeModal);

export function showWelcomeModal() {
  if (!document.body.hasAttribute('listener-on-welcome-dialog')) {
    document.body.addEventListener('sl-after-hide', closeWelcomeDialog);
    document.body.setAttribute('listener-on-welcome-dialog', true);
  }

  const dialog = document.createElement('x-welcome-modal');
  dialog.open = true;
  dialog.onClose = () => dialog.open = false;
  
  document.body.append(dialog);
}

function closeWelcomeDialog(event) {
  if (event.target.tagName.toLowerCase() === 'x-welcome-modal') {
    event.target.remove();
  }
}