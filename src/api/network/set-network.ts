import ApiClient from '/api/client.js';
import { store } from '/state/store.js'

import { 
  postResponse,
} from './set-network.mocks.js'

const client = new ApiClient(store.networkContext.apiBaseUrl)

export async function putNetwork(body: unknown) {
  const res = await client.put(`/system/network/set-pending`, body, { mock: postResponse });
  return res
}
