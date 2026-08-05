import { LitElement, html, css } from '/lib/lit-all.js';
import "/components/common/page-banner.js";

interface HomeOption {
  color: string;
  prefix: string;
  label: string;
  icon: string;
  desc: string;
}

class HomeView extends LitElement {
  options: HomeOption[];

  static styles = css`
    :host {
      display: block;
      padding: 20px;
    }
    .grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1em;

      @media (min-width: 576px) {
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      }
    }
    
    .card {
      height: 270px;
      background: #2e2e32;
      padding: 20px;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      align-items: center;
      box-shadow: 2px 2px 5px rgba(0,0,0,0.2);
      border-radius: 8px;
      user-select: none;
    }

    .card .wrap-label {
      margin-bottom: -1em;
    }

    .card .wrap-label .label {
      font-size: 1.75em;
      font-family: "Comic Neue";
      font-weight: 700;
      position: relative;
      z-index: 0;

      @media (min-width: 576px) {
        font-size: 2em;
      }

      span.prefix {
        font-size: 1.35rem;
        font-family: "Comic Neue";
        font-weight: 700;
        color: yellow;
        position: absolute;
        transform: rotateZ(-30deg);
        top: -10px;
        left: -22px;
        z-index: 1;
      }
    }



    .card .wrap-icon {
      &.red { color: #f93d46; }
      &.blue { color: #0087ff; }
      &.pink { color: deeppink; }
      &.yellow { color: #ffc437; }
      &.green { color: #2ede75; }
      &.white { color: white; }
      &.purple { color: #b469ff; }

      .icon {
        font-size: 5.5em;
      }
    }

    .card .wrap-desc {
      font-size: 0.8rem;
      text-align: center;
      line-height: 1.2;
      color: rgba(255, 255, 255, 0.5);
    }

    .card:hover {
      background: #3c3c40;
      cursor: pointer;
    }

    .card:hover .wrap-icon .icon {
      font-size: 7rem;
    }
  `

  constructor() {
    super();
    this.options = [
      { color: "yellow", prefix: "Such", label: "Node", icon: "cpu-fill", desc: "Node activity, stats and network contribution" },
      { color: "blue", prefix: "Very", label: "Browse", icon: "ui-checks-grid", desc: "Install free and open source Dogecoin software" },
      { color: "white", prefix: "Much", label: "Develop", icon: "code-slash", desc: "Write software interacting with the Dogecoin blockchain" },
      { color: "red", prefix: "Many", label: "Monitor", icon: "heart-pulse-fill", desc: "View the vital signs of your Dogebox" },
      { color: "green", prefix: "So", label: "Profile", icon: "person-circle", desc: "Manage your private and public identity" },
    ]
  }

  render() {
    return html`
      <page-banner title="Dogebox" subtitle="Dogecoin">
        <p>Easily manage your Dogecoin Node.<br/>
        Explore the Doge Ecosystem while you're at it.</p>
      </page-banner>

      <div class="grid">
        ${this.options.map((o) => html`
          <div class="card">
            <div class="wrap-label">
              <span class="label">
                <span class="prefix">${o.prefix}</span>
                ${o.label}
              </span>
            </div>
            <div class="wrap-icon ${o.color}">
              <sl-icon class="icon" name="${o.icon}"></sl-icon>
            </div>
            <div class="wrap-desc">
              <span class="desc">${o.desc}</span>
            </div>
          </div>
        `)}

      </div>
    `;
  }
}

customElements.define('x-page-home', HomeView);