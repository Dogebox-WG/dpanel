import { LitElement, html, classMap } from "/vendor/@lit/all@3.1.2/lit-all.min.js";
import * as methods from "/components/common/dynamic-form/index.js";
import { bindToClass } from "/utils/class-bind.js";
import { styles } from "./styles.js";
import { themes } from "./themes.js";
import { onceThenDebounce } from "/utils/debounce.js";
import { asyncTimeout } from "/utils/timeout.js";

class DynamicForm extends LitElement {
  static get properties() {
    return {
      values: { type: Object },
      fields: { type: Object },
      onSubmit: { type: Object },
      footerStart: { type: Object },
      requireCommit: { type: Boolean },
      markModifiedFields: { type: Boolean },
      allowDiscardChanges: { type: Boolean },
      theme: { type: String },
      _activeFormId: { type: String, state: true },
      _dirty: { type: Number, state: true },
      _initializing: { type: Boolean },
      _loading: { type: Boolean, state: true },
      _orientation: { type: String, reflect: true },
      _rules: { type: Object, state: true },
      _celebrate: { type: Boolean }
    };
  }

  static styles = [styles, themes];

  constructor() {
    super();
    bindToClass(methods, this);
    this.values = {};
    this.fields = {};
    this.footerStart = null;
    this.requireCommit = false;
    this.markModifiedFields = false;
    this.allowDiscardChanges = false;
    this._activeFormId = null;
    this._dirty = 0;
    this._initializing = false;
    this._loading = false;
    this._orientation = "portrait";
    this.theme = ''
    this._rules = [];
    this._flattenedFields = [];
  }

  set fields(newValue) {
    this._fields = newValue;
    if (!newValue.sections) return;

    // Create a reactive property for every form field.
    this._initializeFormFieldProperties(newValue);
  }

  set values(newValue) {
    if (!newValue) return;

    // When an external actor (such as a  parent component, web socket)
    // provides new values, set them but preserve unsaved edits.
    this._initializeValuesPreservingEdits(newValue);
  }

  set _dirty(value) {
    // Adjust only if incoming value differs, also emit change event.
    if (this.__dirty !== value) {
      this.__dirty = value;
      this._dispatchEvent("dirty-change", { dirty: this._dirty });
    }
  }

  set _loading(value) {
    // Adjust only if incoming value differs, also emit change event.
    if (this.__loading !== value) {
      this.__loading = value;
      this._dispatchEvent("loading-change", { loading: this._loading });
    }
  }

  get fields() {
    return this._fields;
  }

  get values() {
    return this._values;
  }

  get _dirty() {
    return this.__dirty;
  }

  get _loading() {
    return this.__loading;
  }

  toggleLoader() {
    this._initializing = !this._initializing;
  }

  toggleCelebrate() {
    // Not an async function
    this._celebrate = true;
    setTimeout(() => {
      this._celebrate = false;
    }, 1500);
  }

  toggleLabelLoader(fieldName) {
    const { labelKey } = this.propKeys(fieldName);
    this[labelKey] = !this[labelKey];
    this.requestUpdate();
  }

  getFormValues = () => {
    // Purpose of this method is to return the values of the form
    // In a key/val structure, where key is the field name, val is the field value.
    // eg. { colour: '#0000FF' }
    let out = {}
    this._flattenedFields.forEach(field => {
      out[field.name] = this[`_${field.name}`]
    });
    return out;
  }

  getState = () => {
    // Extending getFormValues, this does the same except for any field that has
    // an options property, it will supply the selected option object as the value.
    // eg. { colour: { value: '#0000FF', label: 'Blue', primary: true } }
    let out = {};
    this._flattenedFields.forEach(field => {
      out[field.name] = field.options
        ? field.options.find(option => option.value === this[`_${field.name}`])
        : this[`_${field.name}`]
    });

    return out;
  }

  setValue(fieldName, newValue) {
    const { currentKey } = this.propKeys(fieldName);
    this[currentKey] = newValue;
    this._checkForChanges();
  }

  firstUpdated() {
    this._activeFormId = this.shadowRoot.querySelector('form').id;
    this._checkForChanges();
  }

  render() {
    if (!this?.fields?.sections || this._initializing) {
      return html`<div class="loader-overlay">
        <sl-spinner style="font-size: 2rem; --indicator-color: #bbb;"></sl-spinner>
      </div>`
    };

    return html`
      <sl-resize-observer
        @sl-resize=${onceThenDebounce(this._handleResize, 300)}
      >
        <div class="dynamic-form-wrapper">
          ${this._generateOneOrManyForms(this.fields)}
        </div>
      </sl-resize-observer>
    `;
  }

  async updated(changedProperties) {
    await this._onUpdate(changedProperties);
  }
}

customElements.define("dynamic-form", DynamicForm);
