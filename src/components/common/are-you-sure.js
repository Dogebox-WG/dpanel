import { html, nothing } from "/vendor/@lit/all@3.1.2/lit-all.min.js";
import "/components/views/confirmation-prompt/index.js";

export function areYouSure({ 
  title = 'Are you sure?',
  description = '',
  topButtonText = 'Confirm',
  topButtonVariant = 'primary',
  topButtonClick = () => {},
  bottomButtonText = 'Cancel',
  bottomButtonVariant = 'text',
  bottomButtonClick = () => {}
}) {
  if (!document.body.hasAttribute('listener-on-confirmation-dialog')) {
    document.body.addEventListener('sl-after-hide', closeConfirmationDialog);
    document.body.setAttribute('listener-on-confirmation-dialog', true);
  }

  // Dialog element
  const dialog = document.createElement('sl-dialog');
  dialog.classList.add("confirmation-dialog");
  dialog.label = '';
  dialog.noHeader = true;

  // Create confirmation prompt
  const confirmationPrompt = document.createElement('x-confirmation-prompt');
  confirmationPrompt.title = title;
  confirmationPrompt.description = description;
  confirmationPrompt.topButtonText = topButtonText;
  confirmationPrompt.topButtonVariant = topButtonVariant;
  confirmationPrompt.bottomButtonText = bottomButtonText;
  confirmationPrompt.bottomButtonVariant = bottomButtonVariant;

  // Setup button handlers
  confirmationPrompt.topButtonClick = () => {
    topButtonClick();
    dialog.hide();
  };
  
  confirmationPrompt.bottomButtonClick = () => {
    bottomButtonClick();
    dialog.hide();
  };

  dialog.appendChild(confirmationPrompt);
  document.body.append(dialog);
  dialog.show();
}

function closeConfirmationDialog(e) {
  if (e.target.classList.contains('confirmation-dialog')) {
    e.target.remove();
  }
}