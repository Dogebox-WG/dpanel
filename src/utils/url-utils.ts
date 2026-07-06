export function isUnauthedRoute(): boolean {
  const pathname = window.location.pathname;

  if (pathname.startsWith("/login")) {
    return true;
  }

  if (pathname.startsWith("/logout")) {
    return true;
  }

  return false;
}

export function hasFlushParam(): boolean {
  const searchParams = new URLSearchParams(window.location.search);
  return searchParams.has("flush");
}
