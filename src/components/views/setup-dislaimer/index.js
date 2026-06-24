import { LitElement, html, css } from "/lib/lit-all.js";

class SetupDisclaimerView extends LitElement {

  static styles = css`
    .wrap {
      padding: 10px 0px;
      max-width: 100%;
      @media (min-width: 576px) {
        padding: 20px;
        max-width: 520px;
      }
    }

    .banner {
      text-align: center;
      margin-top: 0.5em;
      padding: 1em 1em 1.8em 1em;
      border-radius: 16px;
      background: var(--sl-color-purple-300);
      background-image: linear-gradient(to bottom right, var(--sl-color-purple-500), var(--sl-color-purple-300));
      font-family: 'Comic Neue';

      h1 {
        line-height: 1rem;
      }

      span {
        display: inline-block;
        font-size: 1.2rem;
        line-height: 1.5rem;
        max-width: 100%;
        @media (min-width: 576px) {
          max-width: 380px;
        }
      }
    }
  `

  static get properties() {
    return {
      nextStep: { type: Function },
    };
  }

  render() {
    return html`
      <div class="wrap">
        <img src="/static/img/dogebox-logo.jpg" alt="Dogebox Logo" width="100%" />
        <div class="banner">
          <h1>Welcome to Dogebox!</h1>
          <span>
            We hope you’ll like it here, before we start just a few words to cover your butt ...and ours!
          <span>
        </div>

        <div>
          <h3>Facts you need to accept:</h3>
          <span>
            <ul>
              <li>Dogebox is a bonafide Linux server designed to run ‘on the internet’, and that makes you a Linux System Administrator  congratulations: here’s your badge 🐧</li> 
              <li style="padding-top: 10px;">You understand that while we (Dogecoin developers) have done everything we can to build a secure system with container-isolation, firewalls and stuff, ultimately you are responsible if you install some random software that owns you, steals your crypto and says mean things to your mom.</li>
              <li style="padding-top: 10px;">With great power comes great responsibility, we encourage you to begin your crypto-savvy, tech-savvy journey here by understanding how the system works, how it’s safety precautions put you in control, and what that means.</li>
              <li style="padding-top: 10px;">Good Luck! And if you get stuck, <a href="https://discord.gg/VEUMWpThg9">we're here to help!</a></li>
            </ul>
          </span>
        </div>

        <div style="margin-top: 3em;">
          <h3>Actual legal stuff you also agree to:</h3>
          <span>
            Copyright (c) 2024 Dogecoin Foundation<br /><br />
            Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:<br /><br />
            The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.<br /><br />
            THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
          </span>
        </div>
        <sl-divider style="--spacing: 2rem;"></sl-divider>
        <div style="display: flex; justify-content: end; margin-bottom: 2em;">
          <sl-button class="cta" style="width:180px" variant="success" slot="footer" outline @click=${this.nextStep}>I Agree</sl-button>
        </div>
      </div>
    `;
  }
}

customElements.define("x-setup-dislaimer", SetupDisclaimerView);
