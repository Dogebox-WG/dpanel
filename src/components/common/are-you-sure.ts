import { openDbxModal } from "/components/common/dbx-modal/open-modal.js";

export interface AreYouSureOptions {
  title?: string;
  description?: string;
  topButtonText?: string;
  topButtonVariant?: string;
  topButtonClick?: () => void;
  bottomButtonText?: string;
  bottomButtonClick?: () => void;
}

export function areYouSure({ 
  title = 'Are you sure?',
  description = '',
  topButtonText = 'Confirm',
  topButtonVariant = 'primary',
  topButtonClick = () => {},
  bottomButtonText = 'Cancel',
  bottomButtonClick = () => {}
}: AreYouSureOptions) {
  const modal = openDbxModal({
    title,
    subtitle: description,
    primaryLabel: topButtonText,
    primaryVariant: topButtonVariant,
    cancelLabel: bottomButtonText,
    onPrimaryClick: topButtonClick,
    onCancelClick: bottomButtonClick,
  });
  modal.classList.add("confirmation-dialog");
}
