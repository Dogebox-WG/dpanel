export function isUnauthedRoute() {
  const pathname = window.location.pathname;

  if (pathname.startsWith("/login")) {
    return true;
  }

  if (pathname.startsWith("/logout")) {
    return true;
  }

  return false;
}

export function hasFlushParam() {
  const searchParams = new URLSearchParams(window.location.search);
  return searchParams.has("flush");
}
