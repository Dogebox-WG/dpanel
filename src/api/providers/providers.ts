import ApiClient from '/api/client.js';
import { store } from '/state/store.js'
import type { ActionSubmissionResponse } from '/api/config/config.js';

import { 
  getProvidersResponse,
  setProviderResponse,
} from './providers.mocks.js'

const client = new ApiClient(store.networkContext.apiBaseUrl)

export async function getProviders(pupId: string) {
  const res = await client.get(`/providers/${pupId}`, { mock: getProvidersResponse });
  return res
}

export async function setProvider(pupId: string, body?: unknown) {
  const res = await client.post<ActionSubmissionResponse>(`/providers/${pupId}`, body, { 
    mock: setProviderResponse 
  });
  return res
}

