export function canCopyToClipboard(win = window) {
  if (!win || !win.isSecureContext) {
    return false;
  }

  const clipboard = win.navigator?.clipboard;
  return typeof clipboard?.writeText === "function";
}
