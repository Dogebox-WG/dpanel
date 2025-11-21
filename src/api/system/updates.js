import ApiClient from "/api/client.js";
import { store } from "/state/store.js";

import { getResponse, postResponse } from "./updates.mocks.js";

const client = new ApiClient(store.networkContext.apiBaseUrl);

export async function checkForUpdates() {
  const res = await client.get(`/system/updates`, {
    noLogoutRedirect: true,
    mock: getResponse,
  });
  return res;
}

export async function commenceUpdate(pkg, version) {
  const res = await client.post(`/system/update`, {
    package: pkg,
    version
  }, {
    noLogoutRedirect: true,
    mock: postResponse,
  });
  return res;
}