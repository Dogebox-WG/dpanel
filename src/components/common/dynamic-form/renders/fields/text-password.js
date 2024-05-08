import { html, ifDefined, nothing } from '/vendor/@lit/all@3.1.2/lit-all.min.js';

const ifd = ifDefined;

export function _render_password(field) {
  const { currentKey, isDirtyKey, repeatKey } = this.propKeys(field.name);

  // Custom validation to check if both passwords match
  const validatePasswordsMatch = (event) => {
    const passwordEl = this.shadowRoot.querySelector(`[name=${field.name}]`)
    this[currentKey] !== this[repeatKey]
      ? passwordEl.setCustomValidity('Passwords do not match')
      : passwordEl.setCustomValidity('');
  };

  return html`
    <sl-input
      type="password"
      name=${field.name}
      label=${ifd(field.label)}
      placeholder=${ifd(field.placeholder)}
      help-text=${ifd(field.help)}
      minlength=${ifd(field.minLength)}
      maxlength=${ifd(field.maxLength)}
      pattern=${ifd(field.pattern)}
      size=${ifd(field.size)}
      .value=${ifd(this[currentKey])}
      ?clearable=${field.clearable}
      ?required=${field.required}
      ?disabled=${field.disabled}
      ?password-toggle=${field.passwordToggle}
      ?data-dirty-field=${this[isDirtyKey]}
      @input=${(event) => {
          this._handleInput(event);
          field.requireConfirmation && validatePasswordsMatch(event);
        }}
    >
    </sl-input>
    ${field.requireConfirmation ? html`
      <sl-input
        type="password"
        name=${`${field.name}_repeat`}
        label="Repeat password"
        help-text="Just to be sure you know your password"
        size=${ifd(field.size)}
        ?clearable=${field.clearable}
        ?disabled=${field.disabled}
        data-repeat-field
        .value=${ifd(this[repeatKey])}
        required
        password-toggle
        @input=${(event) => {
          this._handleInput(event);
          validatePasswordsMatch(event);
        }}
      >
    </sl-input>
    ` : nothing }
  `;
}