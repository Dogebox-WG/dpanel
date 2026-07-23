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
import type { SetProviderRequest } from '../providers/providers.js';

const client = new ApiClient(store.networkContext.apiBaseUrl)

/** Request payload for installing a pup (PUT /pup). */
export interface InstallPupRequest {
  sourceId?: string;
  pupName?: string;
  pupVersion?: string;
  autoInstallDependencies?: boolean;
  installWithDevModeEnabled?: boolean;
}

export async function installPup(pupId: string, body?: InstallPupRequest) {
  return client.put<ActionSubmissionResponse>(`/pup`, body, { mock: installMock });
}

export async function uninstallPup(pupId: string) {
  return client.post<ActionSubmissionResponse>(`/pup/${pupId}/uninstall`, undefined, { mock: uninstallMock });
}

export async function purgePup(pupId: string) {
  return client.post<ActionSubmissionResponse>(`/pup/${pupId}/purge`, undefined, { mock: purgeMock });
}

export async function startPup(pupId: string) {
  return client.post<ActionSubmissionResponse>(`/pup/${pupId}/enable`, undefined, { mock: startMock });
}

export async function stopPup(pupId: string) {
  return client.post<ActionSubmissionResponse>(`/pup/${pupId}/disable`, undefined, { mock: stopMock });
}



function isSetProviderRequest(
  body: InstallPupRequest | SetProviderRequest,
): body is SetProviderRequest {
  return Object.values(body).every((v) => typeof v === 'string' || v === undefined);
}

export function pickAndPerformPupAction(pupId: string, action: string, body?: InstallPupRequest | SetProviderRequest) {
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
      return setProvider(pupId, body && isSetProviderRequest(body) ? body : undefined);
      break;

    default:
      console.warn('unsupported pup action requested', action);
      // Previously returned undefined, which crashed callers chaining
      // .catch(); reject instead so their error handling runs.
      return Promise.reject(new Error(`unsupported pup action: ${action}`));
  }
}
