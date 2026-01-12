import ApiClient from "/api/client.js";
import { store } from "/state/store.js";

import {
  getCustomNixResponse,
  saveCustomNixResponse,
  validateCustomNixResponse
} from "./custom-nix.mocks.js";

const client = new ApiClient(store.networkContext.apiBaseUrl);

export async function getCustomNix() {
  const res = await client.get(`/system/custom-nix`, { mock: getCustomNixResponse });
  return res;
}

export async function saveCustomNix(content) {
  const res = await client.put(`/system/custom-nix`, { content }, { mock: saveCustomNixResponse });
  return res;
}

export async function validateCustomNix(content) {
  const res = await client.post(`/system/custom-nix/validate`, { content }, { mock: validateCustomNixResponse });
  return res;
}

