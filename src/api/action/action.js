import ApiClient from '/api/client.js';
import { store } from '/state/store.js'

import { 
  startMock,
  stopMock,
  installMock,
  uninstallMock,
  purgeMock,
  importBlockchainMock
} from './action.mocks.js'

import { setProvider } from '../providers/providers.js';

const client = new ApiClient(store.networkContext.apiBaseUrl)

export async function installPup(pupId, body) {
  return client.put(`/pup`, body, { mock: installMock });
}

export async function uninstallPup(pupId, body) {
  return client.post(`/pup/${pupId}/uninstall`, body, { mock: uninstallMock });
}

export async function purgePup(pupId, body) {
  return client.post(`/pup/${pupId}/purge`, body, { mock: purgeMock });
}

export async function startPup(pupId, body) {
  return client.post(`/pup/${pupId}/enable`, body, { mock: startMock });
}

export async function stopPup(pupId, body) {
  return client.post(`/pup/${pupId}/disable`, body, { mock: stopMock });
}

export async function importBlockchain(pupId, body) {
  return client.post(`/pup/${pupId}/import-blockchain`, body, { mock: importBlockchainMock });
}

export function pickAndPerformPupAction(pupId, action, body) {
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
    case 'import-blockchain':
      return importBlockchain(pupId, body);
      break;
    default:
      console.warn('unsupported pup action requested', action);
  }
}
