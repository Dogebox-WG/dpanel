import { html, css } from "/lib/lit-all.js";

export function renderBanner() {
  const bannerStyles = css`
    .banner {
      border-radius: 16px;
      padding: 1em;
      color: white;
      background-color: var(--sl-color-emerald-600);
      background-image: linear-gradient(
        to bottom right,
        var(--sl-color-emerald-600),
        var(--sl-color-emerald-600)
      );
      position: relative;
      overflow: hidden;
      margin-bottom: 2em;
    }
    .banner main {
      max-width: 65%;
      padding: 0.5em;
    }
    .banner main p {
      font-family: unset;
      line-height: 1.5;
    }
    .banner aside {
      position: absolute;
      right: -65%;
      top: -16px;
      width: 100%;
      height: 130%;
    }
    .banner aside img.doge-store-bg {
      height: 100%;
      width: auto;
      transform: rotate(-4deg);
    }
    .banner h1,
    .banner h2 {
      color: white;
      font-family: "Comic Neue", sans-serif;
      margin: 0px;
      line-height: 1.1;
      margin-bottom: 1rem;
    }
    .banner p:first-of-type {
      margin-top: 0px;
      color: white;
    }
    .banner p:last-of-type {
      margin-bottom: 0;
    }
  `;
  return html`
    <div class="banner">
      <main>
        <h1>Configure your Dogebox</h1>
        <p>Such choice, much start</p>
      </main>
      <aside>
        <img class="doge-store-bg" src="/static/img/system-setup.png" />
      </aside>
    </div>
    <style>
      ${bannerStyles}
    </style>
  `;
}
