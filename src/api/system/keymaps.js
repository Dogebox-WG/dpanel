import ApiClient from "/api/client.js";
import { store } from "/state/store.js";

import { getResponse, postResponse } from "./keymaps.mocks.js";

const client = new ApiClient(store.networkContext.apiBaseUrl);

export async function getKeymap() {
  const res = await client.get(`/system/keymap`, {
    noLogoutRedirect: true,
    mock: getResponse,
  });
  return res;
}

export async function getKeymaps() {
  const res = await client.get(`/system/keymaps`, {
    noLogoutRedirect: true,
    mock: getResponse,
  });
  return res;
}

export async function setKeymap({ keymap }) {
  const res = await client.post(`/system/keymap`, { keymap }, {
    noLogoutRedirect: true,
    mock: postResponse,
  });
  return res;
}
