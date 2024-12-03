import ApiClient from "/api/client.js";
import { store } from "/state/store.js";

import {
  getSSHPublicKeysResponse,
  deleteSSHPublicKeyResponse,
  addSSHPublicKeyResponse,
  updateSSHStateResponse,
  getSSHStateResponse
} from "./sshkeys.mocks.js";

const client = new ApiClient(store.networkContext.apiBaseUrl);

export async function getSSHPublicKeys() {
  const res = await client.get(`/system/ssh/keys`, { mock: getSSHPublicKeysResponse });
  return res;
}

export async function deleteSSHPublicKey(id) {
  const res = await client.delete(`/system/ssh/key/${id}`, { mock: deleteSSHPublicKeyResponse });
  return res;
}

export async function addSSHPublicKey(key) {
  const res = await client.put(`/system/ssh/key`, { key }, { mock: addSSHPublicKeyResponse });
  return res;
}

export async function setSSHState(state) {
  const res = await client.put(`/system/ssh/state`, { ...state }, { mock: updateSSHStateResponse });
  return res;
}

export async function getSSHState(state) {
  const res = await client.get(`/system/ssh/state`, { mock: getSSHStateResponse });
  return res;
}