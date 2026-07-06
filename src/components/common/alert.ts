import { html, nothing } from "/lib/lit-all.js";

type SlAlertEl = HTMLElement & {
  variant: string;
  closable: boolean;
  duration: number;
  toast: () => void;
};

type SlDialogEl = HTMLElement & {
  label: string;
  show: () => void;
  hide: () => void;
};

export interface AlertAction {
  text?: string;
}

export function createAlert(
  variant: string,
  message: string | string[],
  icon = 'info-circle',
  // Callers pass null to mean "no auto-hide".
  duration: number | null = 0,
  action?: AlertAction,
  errorDetail?: unknown,
) {
  try {
    if (!document.body.hasAttribute('listener-on-sl-after-hide')) {
      document.body.addEventListener('sl-after-hide', closeErrorDialog);
      document.body.setAttribute('listener-on-sl-after-hide', 'true');
    }

    const alert = document.createElement('sl-alert') as SlAlertEl;
    alert.variant = variant;
    alert.closable = true;
    if (duration) {
      alert.duration = duration;
    }

    const iconEl = `<sl-icon name="${icon}" slot="icon"></sl-icon>`

    const messageEl = Array.isArray(message)
      ? `<strong>${escapeHtml(message[0])}</strong>` + message.slice(1).map(item => `<br>${escapeHtml(item)}`).join('')
      : escapeHtml(message)

    if (action) {
      const actionEl = `<a class="more" no-intercept href="${`${window.location.href}?error=true`}">${action?.text}</a>`
      alert.innerHTML = `
        ${iconEl}
        ${messageEl}
        ${actionEl}
      `  
    } else {
      alert.innerHTML = `
        ${iconEl}
        ${messageEl}
      `
    }

    document.body.append(alert);

    if (action) {
      try {
        const anchor = alert.querySelector("a.more")
        anchor?.addEventListener("click", (e) => { e.preventDefault(); createMoreDetailDialog(messageEl, errorDetail) })
      } catch (err) {
        console.error(err);
      }
    }
    alert.toast();
  } catch (alertError) {
    console.warn('Failed to produce alert', { variant, message, icon, duration, action, errorDetail });
    console.error(alertError)
  }
}

// Utility function to escape HTML
function escapeHtml(html: string): string {
  const div = document.createElement('div');
  div.textContent = html;
  return div.innerHTML;
}

function createMoreDetailDialog(messageEl: string, providedError: unknown) {
  // Dialog element
  const dialog = document.createElement('sl-dialog') as SlDialogEl;
  dialog.label = 'Error details'
  dialog.classList.add("error-dialog");
  dialog.classList.add('above-toasts') // Dialogs usually sit below toasts in terms of z-index. This class styles them to sit above.

  const error = (providedError instanceof Error)
    ? providedError
    : new Error(String(providedError));

  // Remove leading "Error:" if present
  const errorMessage = error.message.replace(/^Error:\s*/, '');

  // Limit stack trace
  const maxLines = 4;
  if (error.stack) {
    let lines = error.stack.split("\n");
    let limitedStack = lines.slice(0, maxLines + 1).join("\n");
    error.stack = limitedStack;
  }

  // Dialog body content
  const content = document.createElement('div');
  content.innerHTML = `
  <pre style="text-wrap: wrap; font-size: var(--sl-font-size-small); padding: 1em; background: #333;">${messageEl}</pre>
  <pre style="text-wrap: wrap; font-size: var(--sl-font-size-small); padding: 1em; background: #a300ff70; margin-bottom: 0;">${errorMessage}</pre>
  <pre style="font-size: var(--sl-font-size-x-small); padding: 1em; background: #c700ff21; overflow-x: scroll; margin-top: 0;">${error.stack}</pre>
  `
  dialog.appendChild(content);

  // Dialog footer
  const footer = document.createElement('div');
  footer.slot = "footer"
  footer.innerHTML = `<sl-button class="close">Close</sl-button>`
  dialog.appendChild(footer)

  // Close handling
  const closeButton = dialog.querySelector('sl-button.close');
  closeButton?.addEventListener('click', () => dialog.hide());

  document.body.append(dialog);
  dialog.show();
}

// Responsible for cleaning up the DOM after closing an error dialog
function closeErrorDialog(e: Event) {
  const target = e.target as HTMLElement;
  if (target.classList.contains('error-dialog')) {
    target.remove();
  }
}
