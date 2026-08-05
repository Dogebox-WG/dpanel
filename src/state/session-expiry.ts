import { store } from "/state/store.js";

const SESSION_LIFETIME_MS = 60 * 60 * 1000;

let expiryTimer: number | null = null;

export function startSessionExpiry() {
  const sessionExpiresAt = Date.now() + SESSION_LIFETIME_MS;
  store.updateState({ networkContext: { sessionExpiresAt } });
  scheduleSessionExpiry();
}

export function scheduleSessionExpiry() {
  clearSessionExpiryTimer();

  const { sessionExpiresAt } = store.networkContext;
  if (!sessionExpiresAt) {
    return;
  }

  const delay = Math.max(0, sessionExpiresAt - Date.now());
  expiryTimer = window.setTimeout(() => {
    window.location.replace(`${window.location.origin}/logout`);
  }, delay);
}

export function clearSessionExpiryTimer() {
  if (expiryTimer !== null) {
    window.clearTimeout(expiryTimer);
    expiryTimer = null;
  }
}
