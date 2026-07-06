import { html, nothing } from "/lib/lit-all.js";
import "/components/views/confirmation-prompt/index.js";

type SlDialogEl = HTMLElement & {
  label: string;
  noHeader: boolean;
  show: () => void;
  hide: () => void;
};

type ConfirmationPromptEl = HTMLElement & {
  title: string;
  description: string;
  topButtonText: string;
  topButtonVariant: string;
  bottomButtonText: string;
  bottomButtonVariant: string;
  topButtonClick: () => void;
  bottomButtonClick: () => void;
};

export interface AreYouSureOptions {
  title?: string;
  description?: string;
  topButtonText?: string;
  topButtonVariant?: string;
  topButtonClick?: () => void;
  bottomButtonText?: string;
  bottomButtonVariant?: string;
  bottomButtonClick?: () => void;
}

export function areYouSure({ 
  title = 'Are you sure?',
  description = '',
  topButtonText = 'Confirm',
  topButtonVariant = 'primary',
  topButtonClick = () => {},
  bottomButtonText = 'Cancel',
  bottomButtonVariant = 'text',
  bottomButtonClick = () => {}
}: AreYouSureOptions) {
  if (!document.body.hasAttribute('listener-on-confirmation-dialog')) {
    document.body.addEventListener('sl-after-hide', closeConfirmationDialog);
    document.body.setAttribute('listener-on-confirmation-dialog', 'true');
  }

  // Dialog element
  const dialog = document.createElement('sl-dialog') as SlDialogEl;
  dialog.classList.add("confirmation-dialog");
  dialog.label = '';
  dialog.noHeader = true;

  // Create confirmation prompt
  const confirmationPrompt = document.createElement('x-confirmation-prompt') as ConfirmationPromptEl;
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

function closeConfirmationDialog(e: Event) {
  const target = e.target as HTMLElement;
  if (target.classList.contains('confirmation-dialog')) {
    target.remove();
  }
}
