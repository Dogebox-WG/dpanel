import ApiClient from '/api/client.js';
import { store } from '/state/store.js'

import { 
  generateManifests
} from './manifest.mocks.js'

import type { MockDescriptor } from '/api/client.js';

const client = new ApiClient(store.networkContext.apiBaseUrl)

// Legacy endpoint: the mock was passed as a bare function rather than a
// descriptor, so it never matched a debug-panel toggle. Wrapped in a proper
// descriptor to keep the same (inert) behaviour with correct types.
const manifestMock: MockDescriptor = {
  name: '/manifest/',
  method: 'get',
  group: 'manifest',
  res: () => generateManifests(),
};

export async function getManifest() {
  return client.get('/manifest/', { mock: manifestMock });
}