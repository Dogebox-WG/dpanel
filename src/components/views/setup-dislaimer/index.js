import { LitElement, html } from "/vendor/@lit/all@3.1.2/lit-all.min.js";

class SetupDisclaimerView extends LitElement {
  static get properties() {
    return {
      nextStep: { type: Function },
    };
  }

  render() {
    return html`
      <div>
        <div style="text-align: center;">
          <img src="/static/img/dogebox-logo-small.png" alt="Dogebox Logo" />
          <h1>Welcome to Dogebox!</h1>
          <span>
            We hope you’ll like it here, before we start just a few words to cover your butt<br />
            ...and ours!
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

        <div style="margin-top: 5rem; float: right; margin-bottom: 2em;">
          <sl-button variant="success" slot="footer" outline @click=${this.nextStep}>I Agree</sl-button>
        </div>
      </div>
    `;
  }
}

customElements.define("x-setup-dislaimer", SetupDisclaimerView);
