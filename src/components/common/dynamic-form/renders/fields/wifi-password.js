import { testNetwork } from "../../../../../api/network/test-network.js";
import debounce from "../../../../../utils/debounce.js";
import {
  html,
  ifDefined,
  nothing,
} from "/vendor/@lit/all@3.1.2/lit-all.min.js";

const ifd = ifDefined;

export function _render_wifiPassword(field) {
  const { currentKey, isDirtyKey } = this.propKeys(field.name);

  // Custom validation to check if wifi credentials work
  const validateWifiCredentials = debounce((event) => {
    const passwordEl = this.shadowRoot.querySelector(`[name=${field.name}]`);
    testNetwork({
      ssid: this[field.ssidKey],
      password: this[currentKey],
      hidden: this[field.hiddenKey],
    })
      .catch(() => {
        passwordEl.setCustomValidity("Connection Failed, check password");
        passwordEl.reportValidity();
      })
      .then(() => passwordEl.setCustomValidity(""));
  }, 200);

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
      .value=${ifd(this[currentKey] || "")}
      ?clearable=${field.clearable}
      ?required=${field.required}
      ?disabled=${field.disabled}
      ?password-toggle=${field.passwordToggle}
      ?data-dirty-field=${this[isDirtyKey]}
      @input=${(event) => {
        this._handleInput(event);
        validateWifiCredentials(event);
      }}
    >
    </sl-input>
  `;
}
