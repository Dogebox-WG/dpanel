import ApiClient from '/api/client.js';
import { store } from '/state/store.js'
import type { ActionSubmissionResponse } from '/api/config/config.js';

import { 
  startMock,
  stopMock,
  installMock,
  uninstallMock,
  purgeMock
} from './action.mocks.js'

import { setProvider } from '../providers/providers.js';

const client = new ApiClient(store.networkContext.apiBaseUrl)

export async function installPup(pupId: string, body?: unknown) {
  return client.put<ActionSubmissionResponse>(`/pup`, body, { mock: installMock });
}

export async function uninstallPup(pupId: string, body?: unknown) {
  return client.post<ActionSubmissionResponse>(`/pup/${pupId}/uninstall`, body, { mock: uninstallMock });
}

export async function purgePup(pupId: string, body?: unknown) {
  return client.post<ActionSubmissionResponse>(`/pup/${pupId}/purge`, body, { mock: purgeMock });
}

export async function startPup(pupId: string, body?: unknown) {
  return client.post<ActionSubmissionResponse>(`/pup/${pupId}/enable`, body, { mock: startMock });
}

export async function stopPup(pupId: string, body?: unknown) {
  return client.post<ActionSubmissionResponse>(`/pup/${pupId}/disable`, body, { mock: stopMock });
}



export function pickAndPerformPupAction(pupId: string, action: string, body?: unknown) {
  switch(action) {
    case 'install':
      return installPup(pupId, body);
      break;
    case 'uninstall':
      return uninstallPup(pupId);
      break;
    case 'purge':
      return purgePup(pupId);
      break;
    case 'start':
      return startPup(pupId);
      break;
    case 'stop':
      return stopPup(pupId);
      break;
    case 'set-provider':
      return setProvider(pupId, body);
      break;

    default:
      console.warn('unsupported pup action requested', action);
      // Previously returned undefined, which crashed callers chaining
      // .catch(); reject instead so their error handling runs.
      return Promise.reject(new Error(`unsupported pup action: ${action}`));
  }
}
