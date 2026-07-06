export function canCopyToClipboard(win: Window = window): boolean {
  if (!win || !win.isSecureContext) {
    return false;
  }

  const clipboard = win.navigator?.clipboard;
  return typeof clipboard?.writeText === "function";
}
