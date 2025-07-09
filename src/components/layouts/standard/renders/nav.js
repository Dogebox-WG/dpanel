import { html, classMap } from "/vendor/@lit/all@3.1.2/lit-all.min.js";
import { notYet } from "/components/common/not-yet-implemented.js";

export function renderNav(CURPATH) {
  const gutterNavClasses = classMap({
    pulse: this.systemPromptActive,
  });
  const sideNavClasses = classMap({
    inner: true,
    opaque: this.systemPromptActive,
  });
  const menu_open = this.context.store.appContext.menuVisible;
  const showSettingsDot = this.context.store.sysContext.updateAvailable;
  return html`
    <nav id="Nav" ?open=${menu_open} ?animating=${this.menuAnimating}>
      <div id="Side">
        <div class=${sideNavClasses}>
          <div class"nav-body">

            <a href="/" class="logo-link ${CURPATH === "/" ? "active" : ""}" @click=${this.handleNavClick}>
              <img class="img" src="/static/img/dogebox-logo-small.png" />
              <h1 class="sublabel">
                Dogebox
                <sl-icon name="heart-fill" class="icon"></sl-icon>
              </h1>
              <h1 class="label">Dogecoin</h1>
            </a>

            <a href="/pups" class="menu-item ${CURPATH.startsWith("/pups") ? "active" : ""}">
              <sl-icon name="box-seam"></sl-icon>
              Pups
            </a>

            <a href="/explore" class="menu-item ${CURPATH.startsWith("/explore") ? "active" : ""}">
              <sl-icon name="search-heart"></sl-icon>
              Explore
            </a>

            <a href="/settings" class="menu-item ${CURPATH.startsWith("/settings") ? "active" : ""}">
              <sl-icon name="sliders"></sl-icon>
              Settings
              <x-dot ?open=${showSettingsDot} style="--left: -8px;"></x-dot>
            </a>
          </div>

          <!-- <div class="nav-footer">
            <div class="connection online">
              <sl-icon name="cloud-check-fill"></sl-icon>
              Connected
            </div>
          </div> -->
        </div>
      </div>
    </nav>
  `;
}

export function handleExpandableMenuClick(e) {
  e.preventDefault();
  const sourceEl = e.currentTarget;
  const targetEl = this.shadowRoot.querySelector(
    `.sub-menu-list[for=${sourceEl.getAttribute("name")}]`,
  );
  sourceEl.parentNode.classList.toggle("expand");
  targetEl.classList.toggle("hidden");
}
