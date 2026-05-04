import ApiClient from "/api/client.js";
import { store } from "/state/store.js";

import { getResponse, postResponse } from "./updates.mocks.js";

const client = new ApiClient(store.networkContext.apiBaseUrl);

export async function checkForUpdates() {
  const preRelease = store.networkContext?.includePreReleaseSystemUpdates;
  const osRef = store.networkContext?.systemUpdateOSRef?.trim();
  const params = new URLSearchParams();

  if (preRelease) {
    params.set("includePreReleases", "true");
  }

  if (osRef) {
    params.set("osRef", osRef);
  }

  const query = params.toString();
  const res = await client.get(`/system/updates${query ? `?${query}` : ""}`, {
    noLogoutRedirect: true,
    mock: getResponse,
  });
  return res;
}

export async function commenceUpdate(pkg, version, options = {}) {
  const payload = {
    package: pkg,
    version,
  };

  if (options.osRef) {
    payload.osRef = options.osRef;
  }

  const res = await client.post(`/system/update`, payload, {
    noLogoutRedirect: true,
    mock: postResponse,
  });
  return res;
}