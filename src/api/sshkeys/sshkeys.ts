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

export interface SSHPublicKey {
  id: string;
  key: string;
  dateAdded?: string;
}

export interface SSHState {
  enabled?: boolean;
}

export async function getSSHPublicKeys() {
  const res = await client.get<{ keys?: SSHPublicKey[] }>(`/system/ssh/keys`, { mock: getSSHPublicKeysResponse });
  return res;
}

export async function deleteSSHPublicKey(id: string) {
  const res = await client.delete(`/system/ssh/key/${id}`, { mock: deleteSSHPublicKeyResponse });
  return res;
}

export async function addSSHPublicKey(key: string) {
  const res = await client.put(`/system/ssh/key`, { key }, { mock: addSSHPublicKeyResponse });
  return res;
}

export async function setSSHState(state: { enabled: boolean }) {
  const res = await client.put(`/system/ssh/state`, { ...state }, { mock: updateSSHStateResponse });
  return res;
}

export async function getSSHState(state?: unknown) {
  const res = await client.get<SSHState>(`/system/ssh/state`, { mock: getSSHStateResponse });
  return res;
}