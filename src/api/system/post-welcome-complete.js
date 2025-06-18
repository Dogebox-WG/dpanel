import ApiClient from '/api/client.js';
import { store } from '/state/store.js'

import { 
  postResponse,
} from './post-welcome-complete.mocks.js'

const client = new ApiClient(store.networkContext.apiBaseUrl)

export async function postWelcomeComplete() {
  const res = await client.post(`/system/welcome-complete`, {}, { mock: postResponse });
  return res
}
