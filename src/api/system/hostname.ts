import ApiClient from "/api/client.js";
import { store } from "/state/store.js";

import { getResponse, postResponse } from "./keymaps.mocks.js";

const client = new ApiClient(store.networkContext.apiBaseUrl);

export async function setHostname({ hostname }: { hostname: string }) {
  const res = await client.post(`/system/hostname`, { hostname }, {
    noLogoutRedirect: true,
    mock: postResponse,
  });
  return res;
}
