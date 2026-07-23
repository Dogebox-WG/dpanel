import { LitElement, html, css, nothing } from "/lib/lit-all.js";
import { getNetworks } from "/api/network/get-networks.js";
import { putNetwork } from "/api/network/set-network.js";
import { postSetupBootstrap } from "/api/system/post-bootstrap.js";

import { asyncTimeout } from "/utils/timeout.js";
import debounce from "/utils/debounce.js";
import { createAlert } from "/components/common/alert.js";
import { testNetwork } from "/api/network/test-network.js";

// Render chunks
import { renderBanner } from "./renders/banner.js";

// Store
import { store } from "/state/store.js";

import type { Network } from "/api/network/get-networks.js";

/** Option entry shown in the network picker. */
interface NetworkOption {
  interface: string;
  label: unknown;
  value: string | undefined;
  type?: string;
  ssid?: string;
  encryption?: string;
  quality?: number;
  signal?: string;
  active?: boolean;
}

/** de-form state entries are loosely shaped. */
type DeFormState = Record<string, any>;

interface DynamicFormInstance {
  retainChanges: () => void;
  getState: () => DeFormState;
}

interface DeFormEl extends HTMLElement {
  toggleLabelLoader: (name: string) => void;
}

class SelectNetwork extends LitElement {
  declare showSuccessAlert: boolean;
  declare reflectorToken: string;
  declare onBack: (() => void) | null;
  declare onStart: (() => void | Promise<void>) | null;
  declare onSuccess: ((jobId?: string) => void | Promise<void>) | null;
  declare onBootstrapStartFailed: ((message: string) => void) | null;
  declare _server_fault: boolean;
  declare _invalid_creds: boolean;
  declare _setNetworkFields: Record<string, unknown>;
  declare _setNetworkValues: Record<string, unknown>;

  _form: DeFormEl | null;
  _networks: NetworkOption[];

  static styles = css`
    :host {
      display: block;
    }
    .page {
      display: flex;
      align-self: center;
      justify-content: center;
      padding-bottom: 1em;
    }
    .padded {
      width: 100%;
      margin: 0em 0em;
    }
    h1 {
      font-family: "Comic Neue", sans-serif;
    }
    sl-icon {
      margin-right: 0.5em;
    }
  `;

  static get properties() {
    return {
      showSuccessAlert: { type: Boolean },
      reflectorToken: { type: String },
      onBack: { type: Object },
      onStart: { type: Object },
      onSuccess: { type: Object },
      onBootstrapStartFailed: { type: Object },
      _server_fault: { type: Boolean },
      _invalid_creds: { type: Boolean },
      _setNetworkFields: { type: Object },
      _setNetworkValues: { type: Object },
      _attemptSetNetwork: { type: Object },
    };
  }

  constructor() {
    super();
    this._form = null;
    this.onBack = null;
    this.onStart = null;
    this.onBootstrapStartFailed = null;
    this._server_fault = false;
    this._invalid_creds = false;
    this._setNetworkFields = {};
    this._setNetworkValues = {};
    this._networks = [];

    // Set initial fields
    this.updateSetNetworkFields();
  }

  async connectedCallback() {
    super.connectedCallback();
    this.addEventListener(
      "action-label-triggered",
      this.handleLabelActionClick,
    );
    this.addEventListener("sl-hide", this.dismissErrors);
  }

  firstUpdated() {
    this._form = this.shadowRoot?.querySelector<DeFormEl>("de-form") ?? null;
    this._fetchAvailableNetworks();
  }

  updateSetNetworkFields() {
    this._setNetworkFields = {
      sections: [
        {
          name: "select-network",
          submitLabel: "Much Connect",
          fields: [
            {
              name: "network",
              label: "Select Network",
              labelAction: { name: "refresh", label: "Refresh" },
              type: "select",
              required: true,
              options: this._networks.map((network: NetworkOption) => ({
                ...network,
                label:
                  network.type === "ethernet"
                    ? html`${this._renderIcon("ethernet")} ${network.label}`
                    : html`${this._getSignalIcon(network.signal)}
                      ${network.label}`,
              })),
            },
            {
              name: "network-ssid",
              label: "Network SSID",
              type: "text",
              required: true,
              revealOn: (state: DeFormState) => state.network?.value == "hidden",
            },
            {
              name: "network-encryption",
              label: "Network Encryption",
              type: "select",
              required: true,
              revealOn: (state: DeFormState) => state.network?.value === "hidden",
              options: [
                { value: "wep", label: "WEP" },
                { value: "wpa", label: "WPA" },
                { value: "wpa2-psk", label: "WPA2 Personal" },
                { value: "none", label: "None" },
              ],
            },
            {
              name: "network-pass",
              label: "Network Password",
              type: "password",
              required: true,
              passwordToggle: true,
              revealOn: (state: DeFormState) => {
                // If the selected network is a broadcast wifi network with encryption, show.
                if (state.network?.encryption) return true;

                // If we've selected a hidden wifi network, _and_ configured the encryption to be NOT none, show.
                if (state.network?.value === "hidden") {
                  if (
                    state["network-encryption"] &&
                    state["network-encryption"].value !== "none"
                  ) {
                    return true;
                  }
                }

                return false;
              },
            },
            {
              name: "ssh-key",
              label: "SSH Key (Optional)",
              type: "text",
              required: false,
              placeholder: "Pasting an SSH key here will also enable SSH",
            },
          ],
        },
      ],
    };
  }

  async _fetchAvailableNetworks() {
    // Start label spinner
    this._form?.toggleLabelLoader("network");

    const response = await getNetworks();
    if (!response.networks) return [];

    const { networks } = response;

    this._networks = [];

    networks.forEach((network) => {
      if (network.type === "ethernet") {
        let ethernetName = `Ethernet - ${network.interface}`;
        if (network.active) ethernetName += " (connected)";

        return this._networks.push({
          ...network,
          label: ethernetName,
          value: network.interface,
        });
      }

      if (network.type === "wifi") {
        this._networks.push({
          interface: network.interface,
          label: `Hidden Wi-Fi Network (${network.interface})`,
          value: "hidden",
          quality: 0.85,
          signal: "-45dBm",
        });

        return (network.ssids ?? []).map((s) => {
          return this._networks.push({
            interface: network.interface,
            ssid: s.ssid,
            encryption: s.encryption,
            quality: s.quality,
            signal: s.signal,
            label: `${s.ssid} (${network.interface}, ${s.encryption ?? "Open"})`,
            value: `${network.interface}-${s.bssid}`,
          });
        });
      }
    });

    // Networks have been retrieved, ensure they are supplied
    // as the network picker's options.
    this.updateSetNetworkFields();

    // If the retrieved networks has an identifed SELECTED network,
    // set it as the chosen option.
    const selectedNetwork = networks.find((net) => net.selected);
    if (selectedNetwork) {
      this._setNetworkValues = {
        ...this._setNetworkValues,
        network: selectedNetwork.value,
      };
    }

    // Stop label spinner
    this._form?.toggleLabelLoader("network");
  }

  disconnectedCallback() {
    this.removeEventListener("sl-hide", this.dismissErrors);
    this.removeEventListener(
      "action-label-triggered",
      this.handleLabelActionClick,
    );
    super.disconnectedCallback();
  }

  dismissErrors() {
    this._invalid_creds = false;
    this._server_fault = false;
  }

  async handleLabelActionClick(event: Event) {
    event.stopPropagation();
    if (!(event instanceof CustomEvent)) return;
    const detail: { actionName?: string } = event.detail;
    switch (detail.actionName) {
      case "refresh":
        await this._fetchAvailableNetworks();
        break;
      default:
        console.warn("Unhandled form action received", detail);
    }
  }

  _attemptSetNetwork = async (data: unknown, form: unknown, dynamicFormInstance: DynamicFormInstance) => {
    // Check if any field is invalid
    const formFields = this.shadowRoot?.querySelectorAll(
      "sl-input, sl-textarea, sl-select",
    ) ?? [];
    const hasInvalidField = Array.from(formFields).some((field) =>
      field.hasAttribute("data-invalid"),
    );

    if (hasInvalidField) {
      createAlert("warning", "Uh oh, invalid data detected.");
      return;
    }

    const state = dynamicFormInstance.getState();
    const isHiddenNetwork = state.network.value === "hidden";

    const apiData = {
      interface: state.network.interface,
      ssid: isHiddenNetwork ? state["network-ssid"] : state.network.ssid,
      password: state["network-pass"],
      encryption: isHiddenNetwork
        ? state["network-encryption"].value
        : state.network.encryption,
    };

    const response = await putNetwork(apiData).catch(this.handleFault);

    if (!response) {
      dynamicFormInstance.retainChanges(); // stops spinner
      return;
    }

    // Handle error
    const responseError =
      typeof response === "object" && response !== null && "error" in response
        ? response.error
        : undefined;
    if (responseError) {
      dynamicFormInstance.retainChanges(); // stops spinner
      this.handleError(responseError);
      return;
    }

    await this.handleStart();

    // Give the requested network change a moment to settle before starting bootstrap.
    await asyncTimeout(5000);
    // TODO: move this into post-network flow.
    const finalSystemBootstrap = await postSetupBootstrap({
      initialSSHKey: state["ssh-key"],
      // Reflector data is submitted here so bootstrap can persist it for post-reboot submission.
      reflectorToken: this.reflectorToken,
      reflectorHost: store.networkContext.reflectorHost,
      useFoundationPupBinaryCache: store.setupContext.useFoundationPupBinaryCache,
      useFoundationOSBinaryCache: store.setupContext.useFoundationOSBinaryCache
    }).catch((error: unknown) => {
      this.handleBootstrapError(error);
      const handled: { errorHandled: true; jobId?: string } = { errorHandled: true };
      return handled;
    });

    // Bootstrap start errors are handled either by the catch block above or by
    // the missing-jobId guard below.
    if (finalSystemBootstrap && "errorHandled" in finalSystemBootstrap && finalSystemBootstrap.errorHandled) {
      dynamicFormInstance.retainChanges(); // stops spinner
      return;
    }

    if (!finalSystemBootstrap?.jobId) {
      dynamicFormInstance.retainChanges(); // stops spinner
      this.handleBootstrapStartFailure(
        "Setup could not be started. Please review your settings and try again.",
      );
      return;
    }

    // Handle success
    dynamicFormInstance.retainChanges(); // stops spinner
    await this.handleSuccess(finalSystemBootstrap.jobId);
  };

  handleFault = (fault: unknown) => {
    this._server_fault = true;
    console.warn(fault);
    window.alert("boo. something went wrong");
  };

  handleError(err: unknown) {
    const message = [
      "Connection failed",
      "Please check your network details (SSID, Password) and try again.",
    ];
    const action = {
      text: "View details",
    };
    createAlert("danger", message, "emoji-frown", null, action, new Error(String(err)));
  }

  handleBootstrapError(err: unknown) {
    const detail = (err instanceof Error ? err.message : undefined) ?? "No details were returned by the server.";
    createAlert(
      "danger",
      [
        "Setup could not be started.",
        "Please review your settings and try again.",
      ],
      "emoji-frown",
      null,
      { text: "View details" },
      new Error(detail),
    );
    this.handleBootstrapStartFailure(
      `Setup could not be started. ${detail}`,
    );
  }

  handleBootstrapStartFailure(message: string) {
    if (this.onBootstrapStartFailed) {
      this.onBootstrapStartFailed(message);
    }
  }

  async handleStart() {
    if (this.onStart) {
      await this.onStart();
    }
  }

  async handleSuccess(jobId: string) {
    if (this.showSuccessAlert) {
      createAlert(
        "success",
        "Network configuration saved.",
        "check-square",
        4000,
      );
    }
    if (this.onSuccess) {
      await this.onSuccess(jobId);
    }
  }

  handleBackClick = () => {
    if (this.onBack) {
      this.onBack();
    }
  }

  _validateNetworkPassword = debounce(async (
    change: { fieldName: string; newValue: string },
    deform: DynamicFormInstance & { shadowRoot?: ShadowRoot | null },
  ) => {
    if (change.fieldName !== "network-pass") return;

    const state = deform.getState();
    const input = deform.shadowRoot?.querySelector<HTMLInputElement>('[name=network-pass]') ?? null;
    if (!input) return;

    const isHiddenNetwork = state.network?.value === "hidden";
    const ssid = isHiddenNetwork
      ? state["network-ssid"]
      : state.network?.ssid ?? state.network?.label;

    try {
      await testNetwork({
        ssid,
        password: change.newValue,
        hidden: isHiddenNetwork,
      });
      input.setCustomValidity("");
    } catch {
      input.setCustomValidity("Connection failed, check password");
      input.reportValidity();
    }
  }, 200);

  _renderIcon(name: string) {
    return html`<sl-icon name=${name}></sl-icon>`;
  }

  _getSignalIcon(signal: string | undefined) {
    if (!signal) return this._renderIcon("wifi-off");

    // Remove 'dBm' suffix and parse the number
    const signalNum = parseFloat(signal.replace("dBm", ""));
    if (isNaN(signalNum)) {
      console.warn(`Invalid signal value: ${signal}`);
      return this._renderIcon("wifi-off");
    }

    if (signalNum >= -45) return this._renderIcon("wifi"); // Excellent
    if (signalNum >= -55) return this._renderIcon("wifi"); // Good
    if (signalNum >= -65) return this._renderIcon("wifi-2"); // Fair
    if (signalNum >= -75) return this._renderIcon("wifi-1"); // Poor
    return this._renderIcon("wifi-off"); // Very poor
  }

  render() {
    return html`
      <div class="page">
        <div class="padded">
          ${renderBanner()}
          ${this._setNetworkFields ? html`
            <de-form
              .fields=${this._setNetworkFields}
              .values=${this._setNetworkValues}
              .onSubmit=${this._attemptSetNetwork}
              .onChange=${this._validateNetworkPassword}
              .onBack=${this.onBack ? this.handleBackClick : undefined}
              requireCommit
              theme="dark"
              accent="amber"
              style="--submit-btn-width: auto; --submit-btn-anchor: end;"
            >
            </de-form>
            `: nothing }

          <div style="margin: 2em 8px">
            <sl-alert variant="warning" open>
              <sl-icon slot="icon" name="exclamation-triangle"></sl-icon>
              After you hit connect it may take up to 10 minutes while your
              Dogebox is configured!
            </sl-alert>
          </div>
        </div>
      </div>
    `;
  }
}

customElements.define("x-action-select-network", SelectNetwork);