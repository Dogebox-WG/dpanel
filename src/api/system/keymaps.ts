import ApiClient from "/api/client.js";
import { store } from "/state/store.js";

import { getResponse, postResponse } from "./keymaps.mocks.js";

const client = new ApiClient(store.networkContext.apiBaseUrl);

export interface Keymap {
  id: string;
  label: string;
}

export async function getKeymap() {
  const res = await client.get<string>(`/system/keymap`, {
    noLogoutRedirect: true,
    mock: getResponse,
  });
  return res;
}

export async function getKeymaps() {
  const res = await client.get<Keymap[]>(`/system/keymaps`, {
    noLogoutRedirect: true,
    mock: getResponse,
  });
  return res;
}

export async function setKeymap({ keymap }: { keymap: string }) {
  const res = await client.post(`/system/keymap`, { keymap }, {
    noLogoutRedirect: true,
    mock: postResponse,
  });
  return res;
}
