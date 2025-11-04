import {
  LitElement,
  html,
  nothing,
  classMap,
} from "/vendor/@lit/all@3.1.2/lit-all.min.js";

// APIs
import { createKey } from "/api/keys/create-key.js";
import { getKeylist } from "/api/keys/get-keylist.js";
import { getMockList } from "/api/keys/get-keylist.mocks.js";

// Utils
import { asyncTimeout } from "/utils/timeout.js";
import { createAlert } from "/components/common/alert.js";

// Styles
import { createKeyStyles } from "./styles.js";
import { themes } from "/components/common/dynamic-form/themes.js";

// Components
import "/components/common/text-loader/text-loader.js";
import "/components/common/dynamic-form/dynamic-form.js";
import { notYet } from "/components/common/not-yet-implemented.js"

// Render chunks
import { renderBanner } from "./renders/banner.js";

// Store
import { store } from "/state/store.js";

class CreateKey extends LitElement {
  static styles = [createKeyStyles, themes];
  static get properties() {
    return {
      showSuccessAlert: { type: Boolean },
      _authenticationRequired: { type: Boolean },
      _server_fault: { type: Boolean },
      _invalid_creds: { type: Boolean },
      _keyList: { type: Object, state: true },
      _keyListLoading: { type: Boolean },
      _keyReady: { type: Boolean },
      _revealPhrase: { type: Boolean },
      _termsChecked: { type: Boolean },
      _phrase: { type: String },
      onSuccess: { type: Object },
    };
  }

  constructor() {
    super();
    this._authenticationRequired = false;
    this._server_fault = false;
    this._invalid_creds = false;
    this._form = null;
    this._keyList = [];
    this._keyListLoading = false;
    this._phrase = "";
    this.onSuccess = null;
    this.showSuccessAlert = false;
    this.label = "Create your key";
    this.description =
      "This key is used to encrypt the content of your Dogebox, establish and prove your unique identity.";
  }

  async connectedCallback() {
    super.connectedCallback();
  }

  firstUpdated() {
    this._form = this.shadowRoot.querySelector("dynamic-form");
    const keyGenDialog = this.shadowRoot.querySelector(
      "sl-dialog#KeyGenDialog",
    );
    keyGenDialog.addEventListener("sl-request-close", (event) => {
      event.preventDefault();
    });

    this._fetchKeyList();
  }

  async _fetchKeyList(mockData) {
    this._keyListLoading = true;
    const response = await getKeylist();
    this._keyListLoading = false;
    if (!response.keys) return [];

    const { keys } = response;
    this._keyList = mockData || keys;
  }

  disconnectedCallback() {
    this.removeEventListener("sl-hide", this.dismissErrors);
    // this.removeEventListener('action-label-triggered', this.handleLabelActionClick);
    super.disconnectedCallback();
  }

  dismissErrors() {
    this._invalid_creds = false;
    this._server_fault = false;
  }

  handleSuccess() {
    if (this.showSuccessAlert) {
      createAlert("success", "Key created/imported.", "check-square", 2000);
    }
    if (this.onSuccess) {
      this.onSuccess();
    }
  }

  handleError() {
    // Create alert
    window.alert('Nope');
  }



  async handleGenKeyClick() {
    const genKeyBtn = this.shadowRoot.querySelector("#GenKeyBtn");
    const dialog = this.shadowRoot.querySelector("#KeyGenDialog");

    genKeyBtn.loading = true;
    await asyncTimeout(1000);

    // Key is encrypted with user set password
    // If user password unknown, prompt for authentication.
    if (!store.setupContext.hashedPassword) {
      this._authenticationRequired = true;
      dialog.show();
      return;
    }

    // If user password retained, attempt to create key
    dialog.show();

    const res = await createKey(store.setupContext.hashedPassword)
    if (!res || !res.success || res.error || !res.seedPhrase) {
      this.handleError();
    }

    // Remove hashedPassword from application state
    store.updateState({ setupContext: { hashedPassword: null }});

    // Key is ready, recovery phrase available.
    this._phrase = res.seedPhrase;
    this._keyReady = true;
  }

  handlePhraseRevealClick() {
    this._revealPhrase = true;
  }

  handleCopyButtonClick() {
    this.shadowRoot.querySelector("#PhraseCopyBtn").click();
  }

  handlePhraseCloseClick() {
    const dialog = this.shadowRoot.querySelector("#KeyGenDialog");
    this._revealPhrase = false;
    dialog.hide();
    this._fetchKeyList(getMockList.keys);
  }

  _handleContinueClick() {
    this.handleSuccess();
  }

  render() {
    const emptyPhrase =
      "one two three four five six seven eight nine ten eleven twelve".split(" ");
    const phrase = this._phrase || [];

    const phraseGridClasses = classMap({
      "phrase-grid": true,
      blur: !this._revealPhrase,
    });

    const phraseOverlayClasses = classMap({
      "phrase-overlay": true,
      hidden: this._revealPhrase,
    });

    const phraseEl = html`
      <div class="phrase-wrap">
        <div class=${phraseOverlayClasses}>
          <div class="text">
            <span
              >Click to reveal your <span class="avoidwrap">Master Key Recovery Phrase</span>.<br />Record this
              phrase and store it in a safe place.</span
            >
          </div>
          <sl-button @click=${this.handlePhraseRevealClick} variant="warning"
            >Reveal Recovery Phrase (24-words)</sl-button
          >
        </div>
        <div class=${phraseGridClasses}>
          ${(this._keyReady ? phrase : emptyPhrase)
            .map(
              (w, i) => html`
                <sl-tag size="large"
                  ><span class="order">${i + 1}</span>
                  <span class="term">${w}</span></sl-tag
                >
              `,
            )}
        </div>
      </div>

      <div class="phrase-actions">
        <sl-button
          variant="text"
          ?disabled=${!this._revealPhrase}
          @click=${() => (this._revealPhrase = !this._revealPhrase)}
        >
          Hide Phrase
          <sl-icon name="eye-slash"></sl-icon>
        </sl-button>

        <sl-button variant="text">
          <sl-copy-button id="PhraseCopyBtn" value=${this._phrase}
            ><span slot="copy-icon"
              >Copy to clipboard &nbsp;<sl-icon name="copy"></sl-icon></span
          ></sl-copy-button>
        </sl-button>
      </div>

      <div class="phraseFooter">
        <sl-divider></sl-divider>
        <div class="phraseProceedActions">
          <sl-checkbox
            @sl-change=${(e) => (this._termsChecked = e.target.checked)}
            >I understand this phrase is the only way to recover my
            Dogebox</sl-checkbox
          >
          <sl-button
            @click=${this.handlePhraseCloseClick}
            variant="primary"
            ?disabled=${!this._termsChecked}
            >I've written it down</sl-button
          >
        </div>
      </div>
    `;

    const emptyKey = html`
      <div class="key-wrap empty">
        <sl-card class="card-footer">
          <div class="title-wrap">
            <span class="labels">
              <span>Such Empty</span>
            </span>
            <span class="actions"></span>
          </div>
          <sl-input
            placeholder="XXXXXXXXXXXXXXXXXXXXXXXXXXXX"
            disabled
            filled
          ></sl-input>
          <div slot="footer">A master key is needed to secure and use your Dogebox</div>
        </sl-card>
      </div>
    `;

    const masterKeyEl = html`
      <div class="key-wrap active">
        <sl-card class="card-footer">
          <div class="title-wrap">
            <span class="labels">
              <span>Master Key</span>
              <sl-tag pill size="small" variant="success">Set</sl-tag>
            </span>
          </div>
          <sl-input
            placeholder="XXXXXXXXXXXXXXXXXXXXXXXXXXXX"
            disabled
            filled
          ></sl-input>
          <div slot="footer">Created at: ${new Date().toISOString()}</div>
        </sl-card>
      </div>
    `;

    // Remove from UI for the moment.
    const importKeyHTML = html`
      <sl-button variant="text" @click=${notYet} ?disabled=${this._keyReady}
        >Import key</sl-button
      >
    `

    const hasMasterKey = this._keyList.length > 0;
    return html`
      <div class="page">
        <div class="padded">
          ${renderBanner(this.label, this.description)}

          <sl-tab-group>
            <sl-tab slot="nav" panel="keys"
              >Your Keys &nbsp;
              ${!this._keyListLoading
                ? html` <sl-tag pill size="small"
                    >${this._keyList.length}</sl-tag
                  >`
                : html` <sl-spinner
                    style="--indicator-color:#aaa;"
                  ></sl-spinner>`}
            </sl-tab>

            <sl-tab-panel name="keys">
              ${!this._keyListLoading && !hasMasterKey
                ? html`
                    ${emptyKey}
                    <div style="text-align: right;">
                      <sl-button
                        id="GenKeyBtn"
                        @click=${this.handleGenKeyClick}
                        variant="primary"
                        ?disabled=${this._keyReady}
                        >Generate Master Key</sl-button
                      >
                    </div>
                  `
                : nothing}
              ${!this._keyListLoading && hasMasterKey
                ? html`
                    ${masterKeyEl}
                    <sl-divider></sl-divider>
                    <div style="text-align: right;">
                      <sl-button
                        @click=${this._handleContinueClick}
                        class="pink"
                        variant="warning"
                        >Next</sl-button
                      >
                    </div>
                  `
                : nothing}
            </sl-tab-panel>
          </sl-tab-group>
        </div>
      </div>

      <sl-dialog id="KeyGenDialog" no-header>
        <div class="inner">
          ${!this._keyReady && this._authenticationRequired ? html `
            <p>Something went wrong.</p>
            <sl-button @click=${() => window.location.reload()}>Refresh</sl-button>
            <p><small>Fault code: A01</small></p>
          `: nothing }

          ${!this._keyReady && !this._authenticationRequired ? html `
            <div style="display: flex; justify-content: center;">
              <text-loader
                loop
                .texts=${["HOdL tight"]}
                endText="Key Created"
                ?loopEnd=${this._keyReady}
              >
              </text-loader>
            </div>`
          : nothing }

          ${this._keyReady && !this._authenticationRequired ? html` ${phraseEl} ` : nothing}
        </div>
      </sl-dialog>
    `;
  }
}

customElements.define("x-action-create-key", CreateKey);
