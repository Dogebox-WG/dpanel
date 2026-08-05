import ApiClient from '/api/client.js';
import { store } from '/state/store.js'
import type { RequestConfig } from '/api/client.js';
import type { BootstrapFacts } from '/types/bootstrap';

import { 
  getResponse,
} from './get-bootstrap.mocks.js'

const client = new ApiClient(store.networkContext.apiBaseUrl)

export interface SetupBootstrapResponse {
  setupFacts?: BootstrapFacts;
  devMode?: boolean;
  // Populated by ApiClient on request failure.
  success?: boolean;
  status?: number;
}

export async function getSetupBootstrap(options?: RequestConfig) {
  const res = await client.get<SetupBootstrapResponse>(`/system/bootstrap`, { ...options, mock: getResponse });
  return res
}
