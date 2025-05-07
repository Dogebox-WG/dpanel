import {
  html,
  css,
  classMap,
  nothing,
} from "/vendor/@lit/all@3.1.2/lit-all.min.js";

export const navStyles = css`
  nav {
    padding: 1em;
    box-sizing: border-box;
    background-color: var(--sl-color-neutral-0);
    position: fixed;
    top: 0px;
    width: 100%;
    z-index: 99;
  }

  nav .nav-inner {
    display: flex;
    flex-direction: row;
    gap: 1em;
    justify-content: space-between;
    align-items: center;
  }

  nav.solid {
    border-bottom: 1px solid var(--sl-input-border-color);
  }

  nav.hidden {
    display: none;
  }

  nav.bottomPadding {
    margin-bottom: 50px;
  }

  nav .center-steps {
    display: flex;
    flex-direction: row;
    gap: 2em;
    margin-left: 40px;
  }

  nav .center-steps .step {
    display: none;
    flex-direction: row;
    align-items: center;
    gap: 0.6em;

    &[data-active-step] {
      display: flex;
    }

    @media (min-width: 576px) {
      display: flex;
    }
  }

  nav .center-steps.hidden {
    visibility: hidden;
  }

  nav .center-steps .step .step-title {
    font-size: 0.9rem;
    color: #777;
  }

  nav .center-steps .step sl-tag::part(base) {
    color: #777;
  }

  /* ACTIVE STEP */
  nav .center-steps .step[data-active-step] .step-title {
    color: white;
  }
  nav .center-steps .step[data-active-step] sl-button::part(base) {
    background: var(--sl-color-neutral-500);
    border-color: var(--sl-color-neutral-500);
    color: white;
    font-weight: bold;
  }

  /* COMPLETED STEP */
  nav .center-steps .step[data-completed-step] .step-title {
    color: white;
  }
  nav .center-steps .step[data-completed-step] sl-button::part(base) {
    background: var(--sl-color-success-400);
    border-color: var(--sl-color-success-400);
    color: white;
    font-weight: bold;
  }

  /* PARTIALLY COMPLETED STEP */
  nav .center-steps .step[data-partial-complete-step] .step-title {
    color: white;
  }
  nav .center-steps .step[data-partial-complete-step] sl-button::part(base) {
    background: var(--sl-color-yellow-500);
    border-color: var(--sl-color-yellow-500);
    color: white;
    font-weight: bold;
  }

  nav .center-steps .step.mobile-only {
    display: flex;
    @media (min-width: 576px) {
      display: none;
    }
  }
`;

export function renderNav(isFirstTimeSetup) {
  const renderMenu = () => {
    return html`
      <div class="dropmenu">
        <sl-dropdown distance="7">
          <sl-button slot="trigger" circle>
            <sl-icon name="three-dots"></sl-icon>
          </sl-button>
          <sl-menu>
            <sl-menu-item>Visit Forum</sl-menu-item>
            <sl-divider></sl-divider>
            <sl-menu-item
              ?disabled=${!this.isLoggedIn}
              @click=${this.performLogout}
              >Logout</sl-menu-item
            >
          </sl-menu>
        </sl-dropdown>
      </div>
    `;
  };

  if (!isFirstTimeSetup) {
    return html`
      <div class="nav-inner">
        <div class="logo"></div>
        <div class="center-steps">Recovery Mode</div>
        ${renderMenu()}
      </div>
    `;
  }

  const centerStepClasses = classMap({
    "center-steps": true,
    hidden: this.activeStepNumber === 0,
  });

  const steps = [
    { name: "intro", label: "Terms" },
    { name: "settings", label: "Config" },
    { name: "pass", label: "Set Password" },
    { name: "key", label: "Create Key" },
    { name: "connect", label: "Connect" },
  ];

  return html`
    <div class="nav-inner">
      <div class="logo"></div>
      <div class="${centerStepClasses}">
        ${steps.map(
          (s, i) => html`
            <div
              class="step"
              ?data-active-step=${this.activeStepNumber === i + 1}
              ?data-partial-complete-step=${checkPartialComplete(
                this.activeStepNumber,
                s,
                i,
              )}
              ?data-completed-step=${this.activeStepNumber > i + 1}
            >
              <sl-button size="small" circle>
                ${this.activeStepNumber > i + 1 ? "✓" : i + 1}
              </sl-button>
              <span class="step-title">${s.label}</span>
            </div>
          `,
        )}
        ${this.activeStepNumber === 6
          ? html`
              <div class="step mobile-only" data-completed-step>
                <sl-button size="small" circle>✓</sl-button>
                <span class="step-title">Ready!</span>
              </div>
            `
          : nothing}
      </div>
      ${renderMenu()}
    </div>
  `;
}

function checkPartialComplete(active, step, stepNumber) {
  if (step.name === "pass") {
    if (active === stepNumber + 1) {
      return true;
    }
    if (active > stepNumber + 1) {
      return false;
    }
  }
  return false;
}
