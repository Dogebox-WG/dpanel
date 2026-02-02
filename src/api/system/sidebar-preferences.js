import ApiClient from "/api/client.js";
import { store } from "/state/store.js";

import {
  getSidebarPreferencesResponse,
  addSidebarPupResponse,
  removeSidebarPupResponse,
} from "./sidebar-preferences.mocks.js";

const client = new ApiClient(store.networkContext.apiBaseUrl);

export async function getSidebarPreferences() {
  const res = await client.get(`/system/sidebar-preferences`, {
    mock: getSidebarPreferencesResponse,
  });
  return res;
}

export async function addSidebarPup(pupId) {
  const res = await client.post(`/system/sidebar-preferences/pups/add`, { pupId }, {
    mock: addSidebarPupResponse,
  });
  return res;
}

export async function removeSidebarPup(pupId) {
  const res = await client.post(`/system/sidebar-preferences/pups/remove`, { pupId }, {
    mock: removeSidebarPupResponse,
  });
  return res;
}
