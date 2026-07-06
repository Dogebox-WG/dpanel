import ApiClient from '/api/client.js';
import { store } from "/state/store.js";

import { 
  getResponse,
} from './get-ip.mocks.js'

export async function getIP(reflectorToken: string) {
  const client = new ApiClient(store.networkContext.reflectorHost, {
    // Set externalAPI so we don't leak our authentication token to the reflector.
    externalAPI: true
  })

  const res = await client.get(`/${reflectorToken}`, { mock: getResponse });
  return res
}
