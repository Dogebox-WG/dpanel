import ApiClient from '/api/client.js';
import { store } from '/state/store.js';
import { mock } from './services.mocks.js';

const client = new ApiClient(store.networkContext.apiBaseUrl);

export async function getAvailableServices() {
  const result = await client.get('/system/services', { mock, noLogoutRedirect: true });
  // Handle auth errors gracefully
  if (result?.error && result?.status === 401) {
    throw new Error('Authentication required for services');
  }
  return result;
}

