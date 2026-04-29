/**
 * Clipboard write is only available in secure contexts (HTTPS or localhost).
 * On plain HTTP, fall back to a focused textarea + execCommand("copy").
 */

function toCopyString(text) {
  if (text == null) return "";
  if (typeof text === "string") return text;
  if (Array.isArray(text)) return text.join(",");
  return String(text);
}

function unsecuredCopyToClipboard(text) {
  const textArea = document.createElement("textarea");
  textArea.value = text;
  textArea.setAttribute("readonly", "");
  textArea.style.position = "fixed";
  textArea.style.left = "-9999px";
  textArea.style.top = "0";
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  textArea.setSelectionRange(0, text.length);
  const ok = document.execCommand("copy");
  textArea.remove();
  if (!ok) {
    throw new Error("Copy command was rejected");
  }
}

/**
 * @param {string | number | readonly unknown[] | null | undefined} text
 * @returns {Promise<void>}
 */
export async function copyText(text) {
  const s = toCopyString(text);
  if (!s) {
    throw new Error("Nothing to copy");
  }
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(s);
      return;
    } catch {
      // Permissions or transient failure — try legacy path
    }
  }
  unsecuredCopyToClipboard(s);
}
