import ApiClient from '/api/client.js';
import { store } from '/state/store.js';
import { mockPupUpdatesApi } from './pup-updates.mocks.js';

const client = new ApiClient(store.networkContext.apiBaseUrl);

// Helper to choose mock or real
function useMock(mockFn, realFn) {
  return store.networkContext.useMocks ? mockFn : realFn;
}

// GET all pup updates
export async function getAllPupUpdates() {
  return useMock(
    () => mockPupUpdatesApi.getAllPupUpdates(),
    () => client.get('/pup/updates')
  )();
}

// GET updates for specific pup
export async function getPupUpdate(pupId) {
  return useMock(
    () => mockPupUpdatesApi.getPupUpdate(pupId),
    () => client.get(`/pup/${pupId}/updates`)
  )();
}

// Force check for pup updates
export async function checkPupUpdates(pupId) {
  return useMock(
    () => mockPupUpdatesApi.checkPupUpdates(pupId),
    () => client.post(`/pup/${pupId}/check-pup-updates`)
  )();
}

// Ignore pup update (handled in frontend only, no API call needed)
export async function ignorePupUpdate(pupId, targetVersion) {
  // This is handled purely in the frontend via IgnoreManager
  return { success: true };
}