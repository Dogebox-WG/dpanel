import "./index.js";

/**
 * Imperative helper to open an x-dbx-modal appended to document.body.
 * Used by legacy-style modal callers (areYouSure, notYet, etc.) during migration.
 */
export function openDbxModal({
  title = "",
  subtitle = "",
  dismissable = true,
  wide = false,
  panelWidth = "",
  primaryLabel = "",
  primaryVariant = "primary",
  primaryDisabled = false,
  primaryLoading = false,
  cancelLabel = "",
  footerLabel = "",
  footerVariant = "primary",
  footerDisabled = false,
  footerLoading = false,
  onPrimaryClick = () => {},
  onFooterClick = () => {},
  onClose = () => {},
  customContent = null,
}) {
  const modal = document.createElement("x-dbx-modal");
  modal.title = title;
  modal.subtitle = subtitle;
  modal.dismissable = dismissable;
  modal.wide = wide;
  if (panelWidth) modal.panelWidth = panelWidth;
  modal.primaryLabel = primaryLabel;
  modal.primaryVariant = primaryVariant;
  modal.primaryDisabled = primaryDisabled;
  modal.primaryLoading = primaryLoading;
  modal.cancelLabel = cancelLabel;
  modal.footerLabel = footerLabel;
  modal.footerVariant = footerVariant;
  modal.footerDisabled = footerDisabled;
  modal.footerLoading = footerLoading;

  if (customContent) {
    const slot = document.createElement("div");
    slot.slot = "custom";
    if (typeof customContent === "string") {
      slot.innerHTML = customContent;
    } else if (customContent instanceof Node) {
      slot.appendChild(customContent);
    }
    modal.appendChild(slot);
  }

  const cleanup = () => {
    modal.remove();
  };

  modal.addEventListener("dbx-close", () => {
    onClose();
    cleanup();
  });

  modal.addEventListener("dbx-primary-click", () => {
    onPrimaryClick();
    modal.open = false;
  });

  modal.addEventListener("dbx-footer-click", () => {
    onFooterClick();
  });

  document.body.append(modal);
  modal.open = true;
  return modal;
}
