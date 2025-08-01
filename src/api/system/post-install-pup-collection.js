import ApiClient from '/api/client.js';
import { store } from '/state/store.js';

import { 
  postResponse,
} from './post-install-pup-collection.mocks.js';

const client = new ApiClient(store.networkContext.apiBaseUrl);

export async function postInstallPupCollection(collectionName) {
  const res = await client.post(`/system/install-pup-collection`, { collectionName }, { mock: postResponse });
  return res;
} 