import ApiClient from '/api/client.js';
import { store } from '/state/store.js'

import { 
  getResponse,
} from './get-networks.mocks.js'

const client = new ApiClient(store.networkContext.apiBaseUrl)

export interface NetworkSSID {
  ssid: string;
  bssid?: string;
  encryption?: string;
  quality?: number;
  signal?: string;
}

export interface Network {
  type: "ethernet" | "wifi";
  interface: string;
  active?: boolean;
  selected?: boolean;
  value?: string;
  ssids?: NetworkSSID[];
}

export async function getNetworks(body?: unknown) {
  const res = await client.get<{ networks?: Network[] }>(`/system/network/list`, { mock: getResponse });
  return res
}
