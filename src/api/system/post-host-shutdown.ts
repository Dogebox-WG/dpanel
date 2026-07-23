import ApiClient from '/api/client.js';
import { store } from '/state/store.js'

import { 
  postResponse,
} from './post-host-shutdown.mocks.js'

const client = new ApiClient(store.networkContext.apiBaseUrl)

export async function postHostShutdown() {
  const res = await client.post(`/system/host/shutdown`, {}, { mock: postResponse });
  return res
}
