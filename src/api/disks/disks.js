import ApiClient from "/api/client.js";
import { store } from "/state/store.js";

import {
  getInstallResponse,
  getResponse,
  postInstallLocationResponse,
  postStorageLocationResponse,
} from "./disks.mocks.js";

const client = new ApiClient(store.networkContext.apiBaseUrl);

export async function getDisks() {
  const res = await client.get(`/system/disks`, {
    mock: getResponse,
    noLogoutRedirect: true,
  });
  console.log("[disk-debug] getDisks response", {
    isArray: Array.isArray(res),
    length: Array.isArray(res) ? res.length : undefined,
    response: res,
  });
  return res;
}

export async function getInstallDisks() {
  const res = await client.get(`/system/install-disks`, {
    mock: getInstallResponse,
    noLogoutRedirect: true,
  });
  console.log("[disk-debug] getInstallDisks response", {
    isArray: Array.isArray(res),
    length: Array.isArray(res) ? res.length : undefined,
    response: res,
  });
  return res;
}

export async function postInstallToDisk({ disk, secret }) {
  const res = await client.post(`/system/install`, { disk, secret }, {
    mock: postInstallLocationResponse,
    noLogoutRedirect: true,
  });
  return res;
}

export async function setStorageDisk({ storageDevice }) {
  const res = await client.post(`/system/storage`, { storageDevice }, {
    mock: postStorageLocationResponse,
    noLogoutRedirect: true,
  });
  return res;
}
