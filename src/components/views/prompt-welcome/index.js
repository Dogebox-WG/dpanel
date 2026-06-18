import { LitElement, html, css } from '/lib/lit-all.js';

class WelcomeDialog extends LitElement {

  static styles = css`
    .padded {
      padding: 20px;
    }

    h1 {
      font-family: 'Comic Neue', sans-serif;
    }

    .welcome-body {
      margin-top: -1px;
      margin-left: -1px;
    }

    .welcome-body img {
      width: 100%;
    }

    .footer-text-wrap {
      text-align: left;
    }

    .footer-text-wrap p.heading {
      font-family: 'Comic Neue';
      font-weight: bold;
      font-size: 1.2rem;
      padding-top: 0px;
      margin-top: 0px;
    }

    .footer-button-wrap {
      display: flex;
      align-items: center;
      justify-content: flex-end;
    }
  `

  closeWelcomeDialog() {
    const dialog = this.shadowRoot.querySelector('sl-dialog')
    dialog.hide();
  }

  render() {
    return html`
      <sl-dialog no-header style="--body-spacing: 0;">
      <div class="welcome-body">
        <img src="/static/img/dogebox-logo.jpg" />
      </div>
      <div class="welcome-footer" slot="footer">
        <div class="footer-text-wrap">
          <p class="heading"><b>Welcome Dogebox-Alpha-Shibe! 🎉</b></p>
          <p>You have in your four dirty paws a pre-beta Dogebox appliance (0.1.2)</p>
          <p>The mission — if you choose the accept it — is to run your Dogebox on the internet, following updates and providing feedback at forum.dogecoin.org.</p>
        </div>
        <sl-divider></sl-divider>
        <div class="footer-button-wrap">
          <sl-button variant="warning" @click=${this.closeWelcomeDialog}>MUCH WOW</sl-button>
        <div>
      </div>
      </sl-dialog>
    `;
  }
}

customElements.define('welcome-dialog', WelcomeDialog);
