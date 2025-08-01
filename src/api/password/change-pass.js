import ApiClient from '/api/client.js';
import { store } from '/state/store.js'

import { 
  postResponse,
} from './change-pass.mocks.js'

const client = new ApiClient(store.networkContext.apiBaseUrl)

export async function postChangePass(body) {
  const requestBody = {
    new_password: body.new_password,
    current_password: body.password,
    seedphrase: body.seedphrase
  };

  const res = await client.post(`/change-password`, requestBody, { mock: postResponse });
  if (res && res.token) {
    store.updateState({ networkContext: { token: res.token }})
  }
  if (res.error === true) {
    return { error: "CHECK-CREDS", status: res.status }
  }
  return res
}
