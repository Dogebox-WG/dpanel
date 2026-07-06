import ApiClient from '/api/client.js';
import { store } from '/state/store.js'

import { 
  postResponse,
} from './create-key.mocks.js'

const client = new ApiClient(store.networkContext.apiBaseUrl)

export async function createKey(password: string) {
  const res = await client.post<{ token?: string }>(`/keys/create-master`, { password }, { mock: postResponse });
  if (res && res.token) {
    store.updateState({ networkContext: { token: res.token }})
  }
  return res
}
