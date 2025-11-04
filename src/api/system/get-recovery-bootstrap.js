import ApiClient from '/api/client.js';
import { store } from '/state/store.js'

import { 
  getResponse,
} from './get-recovery-bootstrap.mocks.js'

const client = new ApiClient(store.networkContext.apiBaseUrl)

export async function getRecoveryBootstrap(options) {
  const res = await client.get(`/system/recovery-bootstrap`, { ...options, mock: getResponse });
  return res
} 