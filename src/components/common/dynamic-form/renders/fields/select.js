import { html, ifDefined } from '/vendor/@lit/all@3.1.2/lit-all.min.js';

const ifd = ifDefined

export function _render_select(field, options) {
  const { currentKey, isDirtyKey } = this.propKeys(field.name);
  return html`
    <sl-select
      name=${field.name}
      .value=${this[currentKey]}
      placeholder=${ifd(field.placeholder)}
      ?multiple=${field.multiple}
      size=${ifd(field.size)}
      maxOptionsVisible=${ifd(field.maxOptionsVisible)}
      ?hoist=${field.hoist}
      ?required=${field.required}
      ?clearable=${field.clearable}
      ?disabled=${field.disabled}
      ?data-dirty-field=${this[isDirtyKey]}
      @sl-change=${this._handleChoice}
      @sl-hide=${(e) => e.stopPropagation()}
      >
      ${options.labelEl}
      ${field.options.map(option => html`
        <sl-option value=${option.value}>${option.label}</sl-option>
      `)}
    </sl-select>
  `;
}
