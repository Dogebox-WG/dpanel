import { html, nothing } from "/vendor/@lit/all@3.1.2/lit-all.min.js";

export function notYet(event) {
  event && event.preventDefault && event.preventDefault();
  event && event.stopPropagation && event.stopPropagation();

  if (!document.body.hasAttribute('listener-on-not-yet-dialog')) {
    document.body.addEventListener('sl-after-hide', closeNotYetDialog);
    document.body.setAttribute('listener-on-not-yet-dialog', true);
  }

  // Dialog element
  const dialog = document.createElement('sl-dialog');
  dialog.classList.add("not-yet-dialog");
  dialog.label = ''

  // Dialog body content
  const content = document.createElement('div');
  content.innerHTML = `
    <div style="display: flex; justify-content: center; align-items: center;">
      <h3>Coming soon</h3>
    </div>
  `
  dialog.appendChild(content);

  // Dialog footer
  const footer = document.createElement('div');
  footer.slot = "footer"
  footer.innerHTML = `<sl-button class="close">Close</sl-button>`
  dialog.appendChild(footer)

  // Close handling
  const closeButton = dialog.querySelector('sl-button.close');
  closeButton.addEventListener('click', () => dialog.hide());

  document.body.append(dialog);
  dialog.show();
}

// Responsible for cleaning up the DOM after closing an error dialog
function closeNotYetDialog(e) {
  if (e.target.classList.contains('not-yet-dialog')) {
    e.target.remove();
  }
}