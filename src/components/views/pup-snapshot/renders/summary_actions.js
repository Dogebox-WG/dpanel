import { html, css, nothing } from '/vendor/@lit/all@3.1.2/lit-all.min.js';
import { stopPup, startPup } from '/api/action/action.js';
import { createAlert } from '/components/common/alert.js';
import { asyncTimeout } from '/utils/timeout.js'

export function renderSummaryActions() {

  this.handleRunningAction = handleRunningAction
  this.handleInstallAction = handleInstallAction

  return html`

    ${this.installed && !this.allowManage && this.gui ? html`
      <sl-button ?loading=${this.loading} ?disabled=${this.disabled} href="${`pup/${this.pupId}`}" @click="${(e) => this.handleLaunchAction(e)}" variant="primary" outline size="medium">
        <sl-icon name="rocket-takeoff" label="launch"></sl-icon> <span class="btn-text">Launch</span>
      </sl-button>
      ` : nothing
    }

    ${!this.installed ? html`
      <sl-button ?disabled=${this.disabled} @click=${(e) => this.handleInstallAction(e, 'install')} variant="primary" outline size="medium">
        ${this._installed_dirty ? html`
          <sl-icon name="check-square-fill" label="Installed"></sl-icon> 
          <span class="btn-text">Installed</span>
          `
        : html`
          <sl-icon name="arrow-down-square-fill" label="Install"></sl-icon> 
          <span class="btn-text">Install</span>
        `
        }
        
      </sl-button>
      ` : nothing
    }

    ${this.installed && !this.markInstalled ? html`
      <sl-button ?disabled=${this.disabled} @click=${(e) => this.handleConfigureAction(e)} outline size="medium">
        <sl-icon name="gear-fill" label="Configure"></sl-icon> <span class="btn-text">Configure</span>
      </sl-button>
      ` : nothing
    }

    ${this.installed && this.markInstalled ? html`
      <sl-button disabled @click=${(e) => this.handleInstallAction(e, 'install')} variant="primary" outline size="medium">
        <sl-icon name="check-square-fill" label="Installed"></sl-icon> 
        <span class="btn-text">Installed</span>
      </sl-button>
      ` : nothing
    }
    
    ${this.installed && this.allowManage && this.running ? html`
      <sl-button ?disabled=${this.disabled} @click=${(e) => this.handleRunningAction(e, 'stop')} variant="danger" outline size="medium">
        <sl-icon name="stop-fill" label="Stop"></sl-icon> <span class="btn-text">Stop</span>
      </sl-button>
      ` : nothing
    }

    ${this.installed && this.allowManage && !this.running ? html`
      <sl-button ?disabled=${this.disabled} @click=${(e) => this.handleRunningAction(e, 'start')} variant="success" outline size="medium">
        <sl-icon name="play-fill" label="Start"></sl-icon> <span class="btn-text">Start</span>
      </sl-button>
      ` : nothing
    }

    <style>${actionStyles}</style>
  `
}

const actionStyles = css`
  .btn-text {
    display: inline-block;
    margin-left: 0.5rem;
  }
`;

export async function handleInstallAction (event, action) {
  event.stopPropagation();
  event.preventDefault();
  if (action !== 'install') return
  if (event.target.disabled) return;

  let actionFailed;
  let button = event.currentTarget;

  button.loading = true;
  button.disabled = true;

  await asyncTimeout(1500, () => {
    button.loading = false;
    button.disabled = true;
    this._installed_dirty = true;
    this.requestUpdate();
  });
  
  await asyncTimeout(750, () => {
    // Shift to installed list.
    this.dispatchEvent(new CustomEvent('pup-installed', {
      detail: { pupId: this.pupId },
      bubbles: true,
      composed: true
    }));
  });
}

export async function handleRunningAction (event, action) {  
  // Prevent event bubbling to parent
  // Because we don't want any parent handling this click and doing things
  event.stopPropagation();
  event.preventDefault();

  // Prevent issuing another request if already loading
  if (event.target.disabled) return;

  // Placeholder for err flag.
  let actionFailed;
  let button = event.currentTarget;

  // We know the target is a sl-button element (thx currentTarget)
  // Set its loading property to true to beging the button spinner
  button.loading = true;
  button.disabled = true;

  // Dispatch a 'busy-start' event
  this.dispatchEvent(new CustomEvent('busy-start', { bubbles: true, composed: true }));

  // Set this pupSnapshot as having focus
  this.focus = true;

  try {
    
    // Initiate a stopPup request over the network
    // and wait for it to complete
    action === 'start' 
      ? await startPup(this.pupId)
      : await stopPup(this.pupId)

  } catch (err) {

    // Not good. Alert the user.
    actionFailed = true;
    createAlert('danger', `
      Uh oh. Failed to ${action.toUpperCase()} pup`,
      'exclamation-diamond'
    );

  } finally {
    // The show must go on.
    // Stop loading, re-enable button
    button.loading = false;
    button.disabled = false;

    this.dispatchEvent(new CustomEvent('busy-stop', { bubbles: true, composed: true }));
    
    // If the action failed, do not adjust running state.
    if (actionFailed) {
      return;
    }

    // When successful, change running state.
    if (action === 'start') {
      this.running = true;
    }

    if (action === 'stop') {
      this.running = false;
    }

    // Remove focus from this snapshot, after a small delay
    setTimeout(() => {
      this.focus = false;
    }, 500);
  }
}

export async function handleConfigureAction (event) {
  event.stopPropagation();
  event.preventDefault();
  this.jumpToTab('config')
}

export function handleLaunchAction (event) {
  event.stopPropagation();
  event.preventDefault();
  
  // Start button spinner
  event.currentTarget.loading = true;

  // Trigger SPA router to navigate
  this.router.go(event.currentTarget.getAttribute('href'))
}
