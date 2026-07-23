import ApiClient from "/api/client.js";
import { store } from "/state/store.js";

import {
  getInstallResponse,
  getResponse,
  postInstallLocationResponse,
  postStorageLocationResponse,
} from "./disks.mocks.js";

const client = new ApiClient(store.networkContext.apiBaseUrl);

/** Suitability verdict for one use of a disk (install target or mass storage). */
export interface DiskSuitabilityVerdict {
  usable?: boolean;
  sizeOK?: boolean;
}

export interface DiskSuitability {
  install?: DiskSuitabilityVerdict;
  storage?: DiskSuitabilityVerdict;
  isAlreadyUsed?: boolean;
}

export interface Disk {
  name: string;
  size?: number;
  sizePretty?: string;
  path?: string;
  label?: string;
  bootMedia?: boolean;
  suitability?: DiskSuitability;
}

export async function getDisks() {
  const res = await client.get<Disk[]>(`/system/disks`, {
    mock: getResponse,
    noLogoutRedirect: true,
  });
  return res;
}

export async function getInstallDisks() {
  const res = await client.get<Disk[]>(`/system/install-disks`, {
    mock: getInstallResponse,
    noLogoutRedirect: true,
  });
  return res;
}

export async function postInstallToDisk({ disk, secret }: { disk: string; secret: string }) {
  const res = await client.post(`/system/install`, { disk, secret }, {
    mock: postInstallLocationResponse,
    noLogoutRedirect: true,
  });
  return res;
}

export async function setStorageDisk({ storageDevice }: { storageDevice: string }) {
  const res = await client.post(`/system/storage`, { storageDevice }, {
    mock: postStorageLocationResponse,
    noLogoutRedirect: true,
  });
  return res;
}
