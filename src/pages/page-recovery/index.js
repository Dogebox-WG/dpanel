import { LitElement, html, css, nothing } from "/vendor/@lit/all@3.1.2/lit-all.min.js";
import { themes } from "/components/common/dynamic-form/themes.js";
import { store } from "/state/store.js";
import { notYet } from "/components/common/not-yet-implemented.js"
import "/components/views/x-launcher-button/index.js";

class SetupCompleteView extends LitElement {
  static get properties() {
    return {
      isFirstTimeSetup: { type: Boolean },
      reflectorToken: { type: String },
    }
  }

  static styles = [
    themes,
    css`
      :host {
        font-family: "Comic Neue";
        text-align: center;
      }
      p {
        font-size: 1.2rem;
      }
      img.hero {
        width: 300px;
      }
      .actions {
        display: flex;
        flex-direction: column;
        max-width: 380px;
        margin: 0 auto 2em auto;
      }
      .actions.gapped {
        gap: 0.55em;
      }
      .actions sl-button::part(base) {
        width: 100%;
      }
      .lower {
        padding: 0.2em 0;
        margin-bottom: 2em;
      }
      .lower h2 {
        line-height: 1rem;
      }

      .pictoral-instruction {
        display: flex;
        flex-direction: row;
        align-items: center;
        padding: .5em;
        justify-content: center;
        border: 1px dashed var(--sl-panel-border-color);
        gap: 0.5em;

        & sl-icon.usb {
          font-size: 2rem;
          position: relative;
          top: -1px;
          transform: rotateZ(90deg);
        }
      }
    `,
  ];

  handleMgmtOptionClick(e, hideViewClose) {
    store.updateState({ setupContext: { view: e.currentTarget.getAttribute('data-id'), hideViewClose: hideViewClose }});
  }

  firstUpdated() {
    // Clear auth token when user is completing first time setup.
    if (this.isFirstTimeSetup) {
      console.log('CLEARING', store);
      store.updateState({ networkContext: { token: null } });
      console.log('DONE', store);
    }
  }

  renderRecoverActions() {
    return html`
      <div class="actions gapped">
        <sl-button variant="neutral" outline data-id="network"
          @click=${this.handleMgmtOptionClick}>Change Network
        </sl-button>

        <sl-button variant="neutral" outline data-id="password"
          @click=${this.handleMgmtOptionClick}>Change Password
        </sl-button>

        <sl-button variant="neutral" outline data-id="reboot"
          @click=${(e) => this.handleMgmtOptionClick(e, true)}>Reboot
        </sl-button>

        <sl-button variant="neutral" outline data-id="power-off"
          @click=${(e) => this.handleMgmtOptionClick(e, true)}>Power Off
        </sl-button>

        <sl-button variant="danger" outline data-id="factory-reset"
          @click=${notYet}>Factory Reset
        </sl-button>
      </div>

      <div class="pictoral-instruction" style="display:none;">
        <sl-icon class="usb" name="usb-drive-fill"></sl-icon>
        <span>Insert the startup USB to perform these actions</span>
      </div>
    `;
  }

  render() {
    return html`
      ${this.isFirstTimeSetup
        ? html`
            <div class="upper">
              <img class="hero" src="/static/img/celebrate.png" />
              <div class="actions">
                <div class="pictoral-instruction" style="display: none;">
                  <sl-icon class="usb" name="usb-drive-fill"></sl-icon>
                  <span>Please remove the startup USB</span>
                </div>

                <p>
                  <b>Congratulations!</b> You have configured your Dogebox with
                  a password, key and connection.
                </p>

                <x-launcher-button
                  .setupData=${this.setupData}
                  .reflectorToken=${this.reflectorToken}
                ></x-launcher-button>

                <p>
                  Need help? Visit
                  <a href="https://discord.gg/VEUMWpThg9" target="_blank"
                    >our discord</a
                  >
                </p>
              </div>
            </div>

            <div class="center">
              <sl-divider></sl-divider>
            </div>
          `
        : nothing}

      <div class="lower">
        ${!this.isFirstTimeSetup
          ? html`
              <h2>Recovery Actions</h2>

              ${this.renderRecoverActions()}
            `
          : nothing}
      </div>
    `;
  }
}

customElements.define("x-page-recovery", SetupCompleteView);
