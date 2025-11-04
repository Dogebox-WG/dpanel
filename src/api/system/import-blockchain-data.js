import ApiClient from '/api/client.js';
import { store } from '/state/store.js';

import { 
  postResponse,
} from './import-blockchain-data.mocks.js';

const client = new ApiClient(store.networkContext.apiBaseUrl);

export async function importBlockchain() {
  const res = await client.post(`/system/import-blockchain-data`, {}, { mock: postResponse });
  return res;
} 