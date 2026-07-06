import ApiClient from '/api/client.js';
import { store } from '/state/store.js'

import { 
  getResponse,
} from './get-networks.mocks.js'

const client = new ApiClient(store.networkContext.apiBaseUrl)

export async function getNetworks(body?: unknown) {
  const res = await client.get(`/system/network/list`, { mock: getResponse });
  return res
}
