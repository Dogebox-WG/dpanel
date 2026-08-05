import ApiClient from '/api/client.js';
import { store } from '/state/store.js'

import { 
  postResponse,
  getResponse,
  getAllResponse,
} from './config.mocks.js'

/** Action submissions return the transaction id used to resolve the action. */
export interface ActionSubmissionResponse {
  id?: string;
  error?: unknown;
}

const client = new ApiClient(store.networkContext.apiBaseUrl)

export async function postConfig(pupId: string, body: Record<string, unknown>) {
  return client.post<ActionSubmissionResponse>(`/config/${pupId}`, body, { mock: postResponse });
}

export async function getConfig(pupId: string) {
  return client.get(`/config/${pupId}`, { mock: getResponse });
}

export async function getConfigs(pupId?: string) {
  return client.get(`/config`, { mock: getAllResponse });
}
