import {
  LitElement,
  html,
  css,
} from "/vendor/@lit/all@3.1.2/lit-all.min.js";

import { asyncTimeout } from "/utils/timeout.js";
import { createAlert } from "/components/common/alert.js";
import { getTimezone, getTimezones, setTimezone } from "/api/system/timezones.js";
import { formatTimezoneWithOffset, sortTimezonesByCity } from "/utils/timezone-formatter.js";

export class DateTimeSettings extends LitElement {
  static styles = css`
    h1 {
      display: block;
      font-family: "Comic Neue", sans-serif;
      text-align: center;
      margin-bottom: .4rem;
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

    .loading-list {
      height: 180px;
      display: flex;
      flex-direction: row;
      justify-content: center;
      align-items: center;
      color: #555555;
      font-family: 'Comic Neue';
    }
  `;

  static get properties() {
    return {
      _loading: { type: Boolean },
      _inflight: { type: Boolean },
      _timezones: { type: Array },
      _current_timezone: { type: String },
      _changes: { type: Object },
    };
  }

  constructor() {
    super();
    this._timezones = [];
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
      const rawTimezones = await getTimezones();
      
      // Transform and sort timezones
      const formattedTimezones = rawTimezones.map(tz => formatTimezoneWithOffset(tz));
      this._timezones = sortTimezonesByCity(formattedTimezones);
      
      this._current_timezone = await getTimezone();

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
      await setTimezone({ timezone: this._changes.timezone });
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

  _handleTimezoneChange(e) {
    this._changes.timezone = e.target.value;
  }

  render() {
    if (this._loading) {
      return html`
        <div class="loading-list">
          <sl-spinner></sl-spinner>
        </div>
      `;
    }
    
    return html`
      <h1>Date and Time</h1>

      <div class="form-control">
        <sl-select
          label="Timezone"
          required
          help-text="Where in the world should your clock be set to"
          name="timezone"
          value=${this._changes.timezone || this._current_timezone || ''}
          ?disabled=${this._inflight}
          @sl-change=${this._handleTimezoneChange}
          hoist
        >
          ${this._timezones.map(
            (timezone) =>
              html`<sl-option value=${timezone.id}>
                ${timezone.displayLabel}
              </sl-option>`
          )}
        </sl-select>
      </div>
      <div slot="footer" class="align-end">
        <sl-button variant="primary" ?disabled=${this._inflight} ?loading=${this._inflight} @click=${this._attemptSubmit}>Submit</sl-button>
      </div>
    `
  }
}

customElements.define('x-action-date-time', DateTimeSettings);