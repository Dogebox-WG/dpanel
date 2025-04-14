import { LitElement, html, css } from "/vendor/@lit/all@3.1.2/lit-all.min.js";
import { getNetworks } from "/api/network/get-networks.js";
import { putNetwork } from "/api/network/set-network.js";
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
              options: this._networks
            },
            {
              name: "network-ssid",
              label: "Network SSID",
              type: "text",
              required: true,
              revealOn: (state) => state.network?.value == "hidden"
            },
            {
              name: "network-encryption",
              label: "Network Encryption",
              type: "select",
              required: true,
              revealOn: (state) => state.network?.value === 'hidden',
              options: [
                { value: 'wep', label: 'WEP' },
                { value: 'wpa', label: 'WPA' },
                { value: 'wpa2-psk', label: 'WPA2 Personal' },
                { value: 'none', label: 'None' },
              ]
            },
            {
              name: "network-pass",
              label: "Network Password",
              type: "password",
              required: true,
              passwordToggle: true,
              revealOn: (state) => {
                // If the selected network is a broadcast wifi network with encryption, show.
                if (state.network?.encryption) return true

                // If we've selected a hidden wifi network, _and_ configured the encryption to be NOT none, show.
                if (state.network?.value === 'hidden') {
                  if (state['network-encryption'] && state['network-encryption'].value !== 'none') {
                    return true
                  }
                }

                return false
              }
            },
            {
              name: "ssh-key",
              label: "SSH Key (Optional)",
              type: "text",
              required: false,
              placeholder: "Pasting an SSH key here will also enable SSH"
            }
          ],
        },
      ],
    };
  }

  async _fetchAvailableNetworks() {
    // Start label spinner
    this._form.toggleLabelLoader("network");

    const response = await getNetworks();
    if (!response.networks) return [];

    const { networks } = response;

    this._networks = []

    networks.forEach((network) => {
      if (network.type === 'ethernet') {
        return this._networks.push({
          ...network,
          label: `Ethernet - ${network.interface}`,
          value: network.interface
        })
      }

      if (network.type === 'wifi') {
        this._networks.push({
          interface: network.interface,
          label: `🛜 Hidden Wi-Fi Network (${network.interface})`,
          value: 'hidden'
        })

        return network.ssids.map((s) => {
          return this._networks.push({
            interface: network.interface,
            ssid: s.ssid,
            encryption: s.encryption,
            label: `🛜 ${s.ssid} (${network.interface}, ${s.encryption ?? 'Open'})`,
            value: `${network.interface}-${s.bssid}`
          })
        })
      }
    })

    // Networks have been retrieved, ensure they are supplied
    // as the network picker's options.
    this.updateSetNetworkFields();

    // If the retrieved networks has an identifed SELECTED network,
    // set it as the chosen option.
    const selectedNetwork = networks.find((net) => net.selected);
    if (selectedNetwork) {
      this._setNetworkValues = {
        ...this._setNetworkValues,
        network: selectedNetwork.value
      }
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

  _attemptSetNetwork = async (data, form, dynamicFormInstance) => {
    // Check if any field is invalid
    const formFields = this.shadowRoot.querySelectorAll('sl-input, sl-textarea, sl-select');
    const hasInvalidField = Array.from(formFields).some(field => field.hasAttribute('data-invalid'));

    if (hasInvalidField) {
      createAlert('warning', 'Uh oh, invalid data detected.');
      return;
    }

    const state = dynamicFormInstance.getState()
    const isHiddenNetwork = state.network.value === 'hidden'

    const apiData = {
      interface: state.network.interface,
      ssid: isHiddenNetwork ? state['network-ssid'] : state.network.ssid,
      password: state['network-pass'],
      encryption: isHiddenNetwork ? state['network-encryption'].value : state.network.encryption
    }

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

    // temp: wait, because this needs to move to being an async call inside dogeboxd
    //       so that the putNetwork above can "complete".
    await asyncTimeout(5000)

    // temp: also call our final initialisation API here.
    // TODO: move this into post-network flow.
    const finalSystemBootstrap = await postSetupBootstrap({
      initialSSHKey: state['ssh-key'],
      // Temporarily don't submit reflectorToken until the service is up and running.
      reflectorToken: this.reflectorToken,
      reflectorHost: store.networkContext.reflectorHost,
      useFoundationPupBinaryCache: store.setupContext.useFoundationPupBinaryCache,
      useFoundationOSBinaryCache: store.setupContext.useFoundationOSBinaryCache
    }).catch(() => { console.log('bootstrap called but no response returned')});

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
      createAlert("success", "Network configuration saved.", "check-square", 4000);
    }
    if (this.onSuccess) {
      await this.onSuccess();
    }
  }

  render() {
    return html`
      <div class="page">
        <div class="padded">
          ${renderBanner()}
          ${this._setNetworkFields ? html`
            <dynamic-form
              .fields=${this._setNetworkFields}
              .values=${this._setNetworkValues}
              .onSubmit=${this._attemptSetNetwork}
              requireCommit
              theme="yellow"
              style="--submit-btn-width: 100%; --submit-btn-anchor: center;"
            >
            </dynamic-form>
            `: nothing }

            <div style="margin: 2em 8px">
              <sl-alert variant="warning" open>
                <sl-icon slot="icon" name="exclamation-triangle"></sl-icon>
                After you hit connect it may take up to 10 minutes while your Dogebox is configured!
              </sl-alert>
            </div>
        </div>
      </div>
    `;
  }
}

customElements.define("x-action-select-network", SelectNetwork);
