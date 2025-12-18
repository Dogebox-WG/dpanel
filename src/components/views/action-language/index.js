import {
  LitElement,
  html,
  css,
  nothing,
} from "/vendor/@lit/all@3.1.2/lit-all.min.js";

import "/components/common/action-row/action-row.js";
import { asyncTimeout } from "/utils/timeout.js";
import { createAlert } from "/components/common/alert.js";
import { getKeymap, getKeymaps, setKeymap } from "/api/system/keymaps.js";

export class LanguageSettings extends LitElement {
  static get properties() {
    return {
    }
  }

  static styles = css`
    h1 {
      display: block;
      font-family: "Comic Neue", sans-serif;
      text-align: center;
      margin-bottom: .4rem;
    }

    p {
      text-align: center;
      line-height: 1.4;
    }

    .helper-text {
      font-size: 0.8rem;
      color: #555555;
      font-family: 'Comic Neue';
      margin-bottom: 0.5em;
      text-align: center;
    }

    .actions {
      display: flex;
      flex-direction: row;
      justify-content: space-between;
      align-items: center;
      margin-top: 1em;

      sl-button {
        margin-right: -1em;
      }
    }

    .key-reveal-dropdown {
      font-size: 0.8rem;
      background: rgba(0,0,0,0.2);
      word-break: break-all;
      margin-left: 48px;
      padding: 1em;
      border-radius: 8px;
    }

    .key-actions {
      margin-left: 48px;
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: flex-end;
    }

    .form-control {
      display: flex;
      flex-direction: column;
      justify-content: flex-start;
      margin: 1em 0em;
    }

    .align-end {
      align-self: flex-end;
    }

    .loading-list, .empty-list {
      height: 180px;
      display: flex;
      flex-direction: row;
      justify-content: center;
      align-items: center;
      color: #555555;
      font-family: 'Comic Neue';
    }

    .confirmation-container {
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: center;
      gap: 1em;
    }

  `;

  static get properties() {
    return {
      _loading: { type: Boolean },
      _inflight: { type: Boolean },
      _keymaps: { type: Array },
      _keymap: { type: String },
      _changes: { type: Object },
    };
  }

  constructor() {
    super();
    this._keymaps = [];
    this._changes = {};
  }
 
  async connectedCallback() {
    super.connectedCallback();
  }
  
  async firstUpdated() {
    window.scrollTo({ top: 0 });
    await this._fetch();
  }
  
  handleDialogClose() {
    this.dispatchEvent(new CustomEvent('sl-request-close', {
      bubbles: true,
      composed: true,
    }));
  }

  async _fetch() {
    try {
      this._loading = true;
      this._keymaps = await getKeymaps();
      this._current_keymap = await getKeymap();

    } catch (e) {
      console.error(e.toString());
    } finally {
      this._loading = false;
    }
  }

  async _attemptSubmit() {
    this._inflight = true;

    // Only input elements that have a name attribute are sent to backend.
    const formFields = this.shadowRoot.querySelectorAll('sl-input[name], sl-select[name], sl-checkbox[name]');
    const hasInvalidField = Array.from(formFields).some(field => field.hasAttribute('data-invalid'));

    await asyncTimeout(2000);

    if (hasInvalidField) {
      createAlert('warning', 'Uh oh, invalid data detected.');
      this._inflight = false;
      return;
    }

    let didSucceed = false

    try {
      console.log(this._changes.keymap);
      await setKeymap({ keymap: this._changes.keymap });
      didSucceed = true;
    } catch (err) {
      console.error('Error occurred when saving config', err);
      createAlert('danger', ['Failed to save config', 'Please refresh and try again'])
    } finally {
      this._inflight = false;
      if (didSucceed) {
        this.handleDialogClose(); 
      }
    }      
  }

  _handleKeymapInputChange(e) {
    const field = e.target.getAttribute('data-field');
    this._changes[field] = e.target.value;
  }

  render() {
    console.log(JSON.stringify(this._current_keymap))
    return html`
      <h1>Language</h1>

      <div class="form-control">

            <sl-select
              name="keymap"
              
              required
              label="Keymap" 
              ?disabled=${this._inflight}
              data-field="keymap"
              value=${this._current_keymap}
              help-text="What keyboard layout do you have?"
              hoist
              @sl-change=${this._handleKeymapInputChange}
            >
              ${this._keymaps.map(
                (keymap) =>
                  html`<sl-option value=${keymap.id}>${keymap.label}</sl-option>`,
              )}
            </sl-select>

        <div slot="footer" class="align-end">
          <sl-button variant="primary" ?disabled=${this._inflight} ?loading=${this._inflight} @click=${this._attemptSubmit}>Submit</sl-button>
        </div>
      </div>
    `
  }
}

customElements.define('x-action-language', LanguageSettings);