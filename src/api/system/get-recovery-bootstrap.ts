import ApiClient from '/api/client.js';
import { store } from '/state/store.js'
import type { RequestConfig } from '/api/client.js';
import type { RecoveryFacts } from '/types/bootstrap';

import { 
  getResponse,
} from './get-recovery-bootstrap.mocks.js'

const client = new ApiClient(store.networkContext.apiBaseUrl)

export interface RecoveryBootstrapResponse {
  recoveryFacts?: Partial<RecoveryFacts>;
  // Populated by ApiClient on request failure.
  success?: boolean;
  status?: number;
}

export async function getRecoveryBootstrap(options?: RequestConfig) {
  const res = await client.get<RecoveryBootstrapResponse>(`/system/recovery-bootstrap`, { ...options, mock: getResponse });
  return res
} 