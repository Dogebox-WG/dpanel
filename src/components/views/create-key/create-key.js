import {
  LitElement,
  html,
  nothing,
  classMap,
} from "/vendor/@lit/all@3.1.2/lit-all.min.js";

// APIs
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

// Render chunks
import { renderBanner } from "./renders/banner.js";

// Store
import { store } from "/state/store.js";

class CreateKey extends LitElement {
  static styles = [createKeyStyles, themes];
  static get properties() {
    return {
      showSuccessAlert: { type: Boolean },
      _server_fault: { type: Boolean },
      _invalid_creds: { type: Boolean },
      _setNetworkFields: { type: Object },
      _setNetworkValues: { type: Object },
      _attemptSetNetwork: { type: Object },
      _keyList: { type: Object, state: true },
      _keyListLoading: { type: Boolean },
      _keyReady: { type: Boolean },
      _revealPhrase: { type: Boolean },
      _termsChecked: { type: Boolean },
      onSuccess: { type: Object },
    };
  }

  constructor() {
    super();
    this.showSuccessAlert = false;
    this._server_fault = false;
    this._invalid_creds = false;
    this._setNetworkFields = {};
    this._form = null;
    this._keyList = [];
    this._keyListLoading = false;
    this.label = "Create your key";
    this.onSuccess = null;
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
      if (event.detail.source === "overlay") {
        event.preventDefault();
      }
    });

    this._fetchKeyList();
  }

  async _fetchKeyList(mockData) {
    this._keyListLoading = true;
    const response = await getKeylist();
    this._keyListLoading = false;
    if (!response.list) return [];

    const { list } = response;
    this._keyList = mockData || list;
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

  async handleGenKeyClick() {
    const genKeyBtn = this.shadowRoot.querySelector("#GenKeyBtn");
    const dialog = this.shadowRoot.querySelector("#KeyGenDialog");

    genKeyBtn.loading = true;

    await asyncTimeout(1000);
    dialog.show();
    genKeyBtn.loading = false;

    await asyncTimeout(3600);
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
    this._fetchKeyList(getMockList.list);
  }

  _handleContinueClick() {
    this.handleSuccess();
  }

  render() {
    const dummyPhrase =
      "hungry tavern drumkit weekend dignified turmoil cucumber pants karate yacht treacle chump";
    const emptyPhrase =
      "one two three four five six seven eight nine ten eleven twelve";

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
              >Click to reveal your Master Key Recovery Phrase.<br />Record this
              phrase and store it in a safe place.</span
            >
          </div>
          <sl-button @click=${this.handlePhraseRevealClick} variant="warning"
            >Reveal Recovery Phrase (12-words)</sl-button
          >
        </div>
        <div class=${phraseGridClasses}>
          ${(this._keyReady ? dummyPhrase : emptyPhrase)
            .split(" ")
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
          <sl-copy-button id="PhraseCopyBtn" value=${dummyPhrase}
            ><span slot="copy-icon"
              >Copy to clipboard &nbsp;<sl-icon name="copy"></sl-icon></span
          ></sl-copy-button>
        </sl-button>
      </div>

      <div class="phraseFooter">
        <sl-divider></sl-divider>
        <div class="phraseProceedActions">
          <sl-checkbox
            @sl-change=${(e) => (this._termsChecked = e.originalTarget.checked)}
            >I understand this prhase is the only way to recover my
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
      <div class="key-wrap">
        <sl-card class="card-footer">
          <div class="title-wrap">
            <span class="labels">
              <span>Master Key</span>
              <sl-tag pill size="small">Unset</sl-tag>
            </span>
            <span class="actions"></span>
          </div>
          <sl-input
            placeholder="XXXXXXXXXXXXXXXXXXXXXXXXXXXX"
            disabled
            filled
          ></sl-input>
          <div slot="footer">Created at: ...</div>
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
            <span class="actions">
              <sl-icon-button name="trash"></sl-icon-button>
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
                    <sl-button
                      id="GenKeyBtn"
                      @click=${this.handleGenKeyClick}
                      variant="primary"
                      ?disabled=${this._keyReady}
                      >Generate Master Key</sl-button
                    >
                    <sl-button variant="text" ?disabled=${this._keyReady}
                      >Import key</sl-button
                    >
                  `
                : nothing}
              ${!this._keyListLoading && hasMasterKey
                ? html`
                    ${masterKeyEl}
                    <sl-divider></sl-divider>
                    <sl-button
                      @click=${this._handleContinueClick}
                      class="pink"
                      style="width:100%"
                      variant="warning"
                      >Continue</sl-button
                    >
                  `
                : nothing}
            </sl-tab-panel>
          </sl-tab-group>
        </div>
      </div>

      <sl-dialog id="KeyGenDialog" no-header>
        <text-loader
          loop
          .texts=${["HOdL tight"]}
          endText="Key Created"
          ?loopEnd=${this._keyReady}
        >
        </text-loader>

        ${this._keyReady ? html` ${phraseEl} ` : nothing}
        <!--dynamic-form
          .fields=${this.masterKeyFields}
          .values=${this.masterKeyValues}
        ></dynamic-form-->
      </sl-dialog>
    `;
  }
}

customElements.define("create-key", CreateKey);
