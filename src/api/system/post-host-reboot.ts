import ApiClient from '/api/client.js';
import { store } from '/state/store.js'

import { 
  postResponse,
} from './post-host-reboot.mocks.js'

const client = new ApiClient(store.networkContext.apiBaseUrl)

export async function postHostReboot() {
  const res = await client.post(`/system/host/reboot`, {}, { mock: postResponse });
  return res
}
