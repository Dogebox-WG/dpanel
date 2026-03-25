import { LitElement, html, css } from "/vendor/@lit/all@3.1.2/lit-all.min.js";
import { getNetworks } from "/api/network/get-networks.js";
import { putNetwork } from "/api/network/set-network.js";
import { testPendingNetwork } from "/api/network/test-network.js";
import { postSetupBootstrap } from "/api/system/post-bootstrap.js";

import { asyncTimeout } from "/utils/timeout.js";
import { createAlert } from "/components/common/alert.js";

// Components
import "/components/common/dynamic-form/dynamic-form.js";

// Render chunks
import { renderBanner } from "./renders/banner.js";

// Store
import { store } from "/state/store.js";

class SelectNetwork extends LitElement {
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
      _server_fault: { type: Boolean },
      _invalid_creds: { type: Boolean },
      _setNetworkFields: { type: Object },
      _setNetworkValues: { type: Object },
      _attemptSetNetwork: { type: Object },
      _internetWarning: { type: String },
    };
  }

  constructor() {
    super();
    this._form = null;
    this._server_fault = false;
    this._invalid_creds = false;
    this._setNetworkFields = {};
    this._setNetworkValues = {};
    this._networks = [];
    this._internetWarning = "";

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
    this._form = this.shadowRoot.querySelector("dynamic-form");
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
              options: this._networks.map((network) => ({
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
              revealOn: (state) => state.network?.value == "hidden",
            },
            {
              name: "network-encryption",
              label: "Network Encryption",
              type: "select",
              required: true,
              revealOn: (state) => state.network?.value === "hidden",
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
              type: "wifiPassword",
              required: true,
              passwordToggle: true,
              revealOn: (state) => {
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
    this._internetWarning = "";

    // Start label spinner
    this._form.toggleLabelLoader("network");

    const response = await getNetworks();
    if (!response.networks) return [];

    const { networks } = response;

    this._networks = [];

    networks.forEach((network) => {
      if (network.type === "ethernet") {
        const mappedLabel =
          typeof network.label === "string" ? network.label.trim() : "";
        let ethernetName = mappedLabel
          ? `${mappedLabel} - ${network.interface}`
          : `Ethernet - ${network.interface}`;
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

        return network.ssids.map((s) => {
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
    this._form.toggleLabelLoader("network");
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

  async handleLabelActionClick(event) {
    event.stopPropagation();
    switch (event.detail.actionName) {
      case "refresh":
        await this._fetchAvailableNetworks();
        break;
      default:
        console.warn("Unhandled form action received", event.detail);
    }
  }

  _buildPendingNetworkData(state) {
    const selectedNetwork = state?.network;
    if (!selectedNetwork?.interface) {
      return null;
    }

    if (selectedNetwork.type === "ethernet") {
      return {
        interface: selectedNetwork.interface,
      };
    }

    const isHiddenNetwork = selectedNetwork.value === "hidden";
    const ssid = isHiddenNetwork ? state["network-ssid"] : selectedNetwork.ssid;
    const encryption = isHiddenNetwork
      ? state["network-encryption"]?.value
      : (selectedNetwork.encryption ?? "none");
    const requiresPassword = encryption && encryption !== "none";
    const password = state["network-pass"] ?? "";

    if (!ssid || !encryption) {
      return null;
    }

    if (requiresPassword && !password) {
      return null;
    }

    return {
      interface: selectedNetwork.interface,
      ssid,
      password,
      encryption,
    };
  }

  async _checkPendingNetworkConnectivity() {
    console.info(
      "[setup/network] Waiting for pending network to settle before internet check",
    );
    await asyncTimeout(5000);

    for (let attempt = 1; attempt <= 3; attempt++) {
      console.info(
        `[setup/network] Running pending network internet check (attempt ${attempt}/3)`,
      );
      const connectivityCheck = await testPendingNetwork().catch((err) => {
        console.warn(
          `[setup/network] Pending network internet check failed (attempt ${attempt}/3)`,
          err,
        );
        return null;
      });

      console.info(
        `[setup/network] Pending network internet check response (attempt ${attempt}/3)`,
        connectivityCheck,
      );

      if (connectivityCheck?.hasInternetConnectivity === true) {
        return true;
      }

      if (connectivityCheck?.hasInternetConnectivity === false) {
        return false;
      }

      if (attempt < 3) {
        await asyncTimeout(1000);
      }
    }

    return false;
  }

  _attemptSetNetwork = async (data, form, dynamicFormInstance) => {
    this._internetWarning = "";

    // Check if any field is invalid
    const formFields = this.shadowRoot.querySelectorAll(
      "sl-input, sl-textarea, sl-select",
    );
    const hasInvalidField = Array.from(formFields).some((field) =>
      field.hasAttribute("data-invalid"),
    );

    if (hasInvalidField) {
      createAlert("warning", "Uh oh, invalid data detected.");
      return;
    }

    const state = dynamicFormInstance.getState();
    const apiData = this._buildPendingNetworkData(state);

    const response = await putNetwork(apiData).catch(this.handleFault);

    if (!response) {
      dynamicFormInstance.retainChanges(); // stops spinner
      return;
    }

    // Handle error
    if (response.error) {
      dynamicFormInstance.retainChanges(); // stops spinner
      this.handleError(response.error);
      return;
    }

    const hasInternetConnectivity = await this._checkPendingNetworkConnectivity();
    if (!hasInternetConnectivity) {
      dynamicFormInstance.retainChanges(); // stops spinner
      this._internetWarning =
        "An internet connection could not be established. Check your network configuration, confirm the connection is up, then press Much Connect again.";
      return;
    }

    // temp: also call our final initialisation API here.
    // TODO: move this into post-network flow.
    const finalSystemBootstrap = await postSetupBootstrap({
      initialSSHKey: state["ssh-key"],
      // Temporarily don't submit reflectorToken until the service is up and running.
      reflectorToken: this.reflectorToken,
      reflectorHost: store.networkContext.reflectorHost,
      useFoundationPupBinaryCache: store.setupContext.useFoundationPupBinaryCache,
      useFoundationOSBinaryCache: store.setupContext.useFoundationOSBinaryCache
    }).catch(() => {
      console.log("bootstrap called but no response returned");
    });

    // if (!finalSystemBootstrap) {
    //   dynamicFormInstance.retainChanges(); // stops spinner
    //   return;
    // }

    // if (finalSystemBootstrap.error) {
    //   dynamicFormInstance.retainChanges(); // stops spinner
    //   this.handleError(finalSystemBootstrap.error);
    //   return;
    // }

    // Handle success
    dynamicFormInstance.retainChanges(); // stops spinner
    dynamicFormInstance.toggleCelebrate();
    await this.handleSuccess();
  };

  handleFault = (fault) => {
    this._server_fault = true;
    console.warn(fault);
    window.alert("boo. something went wrong");
  };

  handleError(err) {
    const message = [
      "Connection failed",
      "Please check your network details (SSID, Password) and try again.",
    ];
    const action = {
      text: "View details",
    };
    createAlert("danger", message, "emoji-frown", null, action, new Error(err));
  }

  async handleSuccess() {
    if (this.showSuccessAlert) {
      createAlert(
        "success",
        "Network configuration saved.",
        "check-square",
        4000,
      );
    }
    if (this.onSuccess) {
      await this.onSuccess();
    }
  }

  _renderIcon(name) {
    return html`<sl-icon name=${name}></sl-icon>`;
  }

  _getSignalIcon(signal) {
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
          ${this._internetWarning ? html`
            <div style="margin: 0 8px 2em 8px">
              <sl-alert variant="warning" open>
                <sl-icon slot="icon" name="exclamation-triangle-fill"></sl-icon>
                <strong>Internet connection required.</strong>
                ${" "}
                ${this._internetWarning}
              </sl-alert>
            </div>
          ` : html``}
          ${this._setNetworkFields ? html`
            <dynamic-form
              .fields=${this._setNetworkFields}
              .values=${this._setNetworkValues}
              .onSubmit=${this._attemptSetNetwork}
              requireCommit
              theme="yellow"
              style="--submit-btn-width: auto; --submit-btn-anchor: end;"
            >
            </dynamic-form>
            `: html`` }

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