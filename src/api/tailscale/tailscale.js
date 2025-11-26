import ApiClient from "/api/client.js";
import { store } from "/state/store.js";

import {
  getTailscaleStateResponse,
  setTailscaleStateResponse,
  setTailscaleConfigResponse,
  getTailscaleStatusResponse
} from "./tailscale.mocks.js";

const client = new ApiClient(store.networkContext.apiBaseUrl);

export async function getTailscaleState() {
  const res = await client.get(`/system/tailscale/state`, { mock: getTailscaleStateResponse });
  return res;
}

export async function setTailscaleState(state) {
  const res = await client.put(`/system/tailscale/state`, { ...state }, { mock: setTailscaleStateResponse });
  return res;
}

export async function setTailscaleConfig(config) {
  const res = await client.put(`/system/tailscale/config`, { ...config }, { mock: setTailscaleConfigResponse });
  return res;
}

export async function getTailscaleStatus() {
  const res = await client.get(`/system/tailscale/status`, { mock: getTailscaleStatusResponse });
  return res;
}

