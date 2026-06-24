import {
  LitElement,
  html,
  css,
} from "/lib/lit-all.js";

import { asyncTimeout } from "/utils/timeout.js";
import { createAlert } from "/components/common/alert.js";
import { getTimezone, getTimezones, setTimezone } from "/api/system/timezones.js";
import { formatTimezoneWithOffset, sortTimezonesByCity } from "/utils/timezone-formatter.js";
import "/bootstrap/deform.js";

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
      _timezoneFields: { type: Object },
      _current_timezone: { type: String },
      _changes: { type: Object },
    };
  }

  constructor() {
    super();
    this._timezones = [];
    this._timezoneFields = this._buildTimezoneFields();
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
      this._timezoneFields = this._buildTimezoneFields();
      
      this._current_timezone = await getTimezone();
      this._changes.timezone = this._current_timezone;

    } catch (e) {
      console.error(e.toString());
    } finally {
      this._loading = false;
    }
  }

  async _attemptSubmit() {
    if (this._changes.timezone === this._current_timezone) {
      this.handleDialogClose();
      return;
    }

    this._inflight = true;
    this._timezoneFields = this._buildTimezoneFields();

    const hasInvalidField = !this._isTimezoneFormValid();

    await asyncTimeout(2000);

    if (hasInvalidField) {
      createAlert('warning', 'Uh oh, invalid data detected.');
      this._inflight = false;
      this._timezoneFields = this._buildTimezoneFields();
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
      this._timezoneFields = this._buildTimezoneFields();
      if (didSucceed) {
        this.handleDialogClose(); 
      }
    }
  }

  _handleTimezoneFormChange(change) {
    if (change.fieldName !== 'timezone') return;
    this._changes.timezone = change.newValue;
  }

  _isTimezoneFormValid() {
    const timezoneForm = this.shadowRoot.querySelector('de-form');
    const form = timezoneForm?.shadowRoot?.querySelector('form');
    return !form || timezoneForm.checkValidity(form);
  }

  _buildTimezoneFields() {
    return {
      sections: [
        {
          name: 'timezone',
          fields: [
            {
              name: 'timezone',
              type: 'select',
              label: 'Timezone',
              required: true,
              help: 'Where in the world should your clock be set to',
              disabled: this._inflight,
              searchable: true,
              hoist: true,
              maxOptionsVisible: 8,
              options: this._timezones.map((timezone) => ({
                value: timezone.id,
                label: timezone.displayLabel,
                searchText: `${timezone.id} ${timezone.label ?? ''}`,
              })),
            },
          ],
        },
      ],
    };
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
        <de-form
          .fields=${this._timezoneFields}
          .values=${{ timezone: this._changes.timezone || this._current_timezone || '' }}
          .onChange=${(change) => this._handleTimezoneFormChange(change)}
          ?markModifiedFields=${false}
          theme="dark"
          accent="purple"
        ></de-form>
      </div>
      <div slot="footer" class="align-end">
        <sl-button variant="primary" ?disabled=${this._inflight} ?loading=${this._inflight} @click=${this._attemptSubmit}>Submit</sl-button>
      </div>
    `
  }
}

customElements.define('x-action-date-time', DateTimeSettings);