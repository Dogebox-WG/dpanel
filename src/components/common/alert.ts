import { openDbxModal } from "/components/common/dbx-modal/open-modal.js";

interface SlAlertEl extends HTMLElement {
  variant: string;
  closable: boolean;
  duration: number;
  toast: () => void;
}

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
    const alert: SlAlertEl = document.createElement('sl-alert');
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
function escapeHtml(html: string) {
  const div = document.createElement('div');
  div.textContent = html;
  return div.innerHTML;
}

function createMoreDetailDialog(messageEl: string, providedError: unknown) {
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
  const message = document.createElement('pre');
  message.style.cssText = "text-wrap: wrap; font-size: var(--sl-font-size-small); padding: 1em; background: #333;";
  message.innerHTML = messageEl;

  const detail = document.createElement('pre');
  detail.style.cssText = "text-wrap: wrap; font-size: var(--sl-font-size-small); padding: 1em; background: #a300ff70; margin-bottom: 0;";
  detail.textContent = errorMessage;

  const stack = document.createElement('pre');
  stack.style.cssText = "font-size: var(--sl-font-size-x-small); padding: 1em; background: #c700ff21; overflow-x: scroll; margin-top: 0;";
  stack.textContent = error.stack ?? "";

  content.append(message, detail, stack);

  let modal: ReturnType<typeof openDbxModal>;
  modal = openDbxModal({
    title: "Error details",
    footerLabel: "Close",
    onFooterClick: () => {
      modal.open = false;
    },
    customContent: content,
  });
  modal.classList.add("error-dialog", "above-toasts");
}
