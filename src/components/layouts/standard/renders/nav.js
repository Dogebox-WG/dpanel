import { html, classMap, nothing } from "/vendor/@lit/all@3.1.2/lit-all.min.js";
import { notYet } from "/components/common/not-yet-implemented.js";
import "/components/common/job-indicator/index.js";

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
  const pupUpdatesCount = this.context.store.pupUpdatesContext?.totalUpdatesAvailable || 0;
  const showPupUpdatesBadge = pupUpdatesCount > 0;

  // Get pinned pups for sidebar
  const pinnedPupIds = this.context.store.sidebarContext?.pinned || [];
  const allPups = this.pkgController?.pups || [];
  
  // Filter to pups that: 1) are pinned, 2) have UIs, 3) are installed
  const pinnedPups = pinnedPupIds
    .map(id => allPups.find(p => p.state?.id === id))
    .filter(p => p && p.state && (p.state.webUIs || []).length > 0)
    .sort((a, b) => {
      const nameA = a.state.manifest?.meta?.name || '';
      const nameB = b.state.manifest?.meta?.name || '';
      return nameA.localeCompare(nameB);
    });

  // Check if current path is a pinned pup's page (to avoid double-highlighting)
  const isOnPinnedPupPage = pinnedPups.some(pup => CURPATH.includes(`/pups/${pup.state.id}`));
  // "Pups" menu should be active for /pups routes, but NOT if we're on a pinned pup's page
  const isPupsMenuActive = CURPATH.startsWith("/pups") && !isOnPinnedPupPage;
  
  return html`
    <nav id="Nav" ?open=${menu_open} ?animating=${this.menuAnimating}>
      <div id="Side">
        <div class=${sideNavClasses}>
          <div class="nav-body">

            <a href="/" class="logo-link ${CURPATH === "/" ? "active" : ""}" @click=${this.handleNavClick}>
              <img class="img" src="/static/img/dogebox-logo-small.png" />
              <h1 class="sublabel">
                Dogebox
                <sl-icon name="heart-fill" class="icon"></sl-icon>
              </h1>
              <h1 class="label">Dogecoin</h1>
            </a>

            <a href="/pups" class="menu-item ${isPupsMenuActive ? "active" : ""}">
              <sl-icon name="box-seam"></sl-icon>
              Pups
              <x-dot ?open=${showPupUpdatesBadge} style="--left: -8px;"></x-dot>
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

            ${pinnedPups.length > 0 ? html`
              <div class="pinned-pups-separator"></div>
              <div class="pinned-pups-container">
                ${pinnedPups.map(pup => {
                  const pupId = pup.state.id;
                  const name = pup.state.manifest?.meta?.name || 'Unknown';
                  const logo = pup.assets?.logos?.mainLogoBase64;
                  const isActive = CURPATH.includes(`/pups/${pupId}`);
                  
                  return html`
                    <a href="/pups/${pupId}/${encodeURIComponent(name)}" 
                       class="menu-item pup-shortcut ${isActive ? "active" : ""}">
                      ${logo 
                        ? html`<img class="pup-icon" src="${logo}" />` 
                        : html`<sl-icon name="box"></sl-icon>`
                      }
                      <span class="pup-name">${name}</span>
                    </a>
                  `;
                })}
              </div>
            ` : nothing}
          </div>

          <div class="nav-footer">
            <job-indicator></job-indicator>
          </div>
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
