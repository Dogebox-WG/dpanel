import ApiClient from '/api/client.js';
import { store } from '/state/store.js';
import { mockPupUpdatesApi } from './pup-updates.mocks.js';

const client = new ApiClient(store.networkContext.apiBaseUrl);

// Helper to choose mock or real
function useMock(mockFn, realFn, fnName) {
  const useMocks = store.networkContext.useMocks;
  console.log(`[PupUpdates API] ${fnName}: useMocks=${useMocks}`);
  return useMocks ? mockFn : realFn;
}

// GET all pup updates
export async function getAllPupUpdates() {
  console.log('[PupUpdates API] getAllPupUpdates called');
  const result = await useMock(
    () => mockPupUpdatesApi.getAllPupUpdates(),
    () => client.get('/pup/updates'),
    'getAllPupUpdates'
  )();
  console.log('[PupUpdates API] getAllPupUpdates result:', result);
  return result;
}

// GET updates for specific pup
export async function getPupUpdate(pupId) {
  console.log(`[PupUpdates API] getPupUpdate called for pupId=${pupId}`);
  const result = await useMock(
    () => mockPupUpdatesApi.getPupUpdate(pupId),
    () => client.get(`/pup/${pupId}/updates`),
    'getPupUpdate'
  )();
  console.log('[PupUpdates API] getPupUpdate result:', result);
  return result;
}

// Force check for pup updates
export async function checkPupUpdates(pupId) {
  console.log(`[PupUpdates API] checkPupUpdates called for pupId=${pupId}`);
  const result = await useMock(
    () => mockPupUpdatesApi.checkPupUpdates(pupId),
    () => client.post(`/pup/${pupId}/check-pup-updates`),
    'checkPupUpdates'
  )();
  console.log('[PupUpdates API] checkPupUpdates result:', result);
  return result;
}

// Upgrade pup to a specific version
export async function upgradePup(pupId, targetVersion) {
  console.log(`[PupUpdates API] upgradePup called for pupId=${pupId}, targetVersion=${targetVersion}`);
  const result = await useMock(
    () => mockPupUpdatesApi.upgradePup(pupId, targetVersion),
    () => client.post(`/pup/${pupId}/upgrade`, { targetVersion }),
    'upgradePup'
  )();
  console.log('[PupUpdates API] upgradePup result:', result);
  return result;
}

// Rollback pup to previous version
export async function rollbackPup(pupId) {
  console.log(`[PupUpdates API] rollbackPup called for pupId=${pupId}`);
  const result = await useMock(
    () => mockPupUpdatesApi.rollbackPup(pupId),
    () => client.post(`/pup/${pupId}/rollback`),
    'rollbackPup'
  )();
  console.log('[PupUpdates API] rollbackPup result:', result);
  return result;
}

// Get previous version info (for rollback)
export async function getPreviousVersion(pupId) {
  console.log(`[PupUpdates API] getPreviousVersion called for pupId=${pupId}`);
  const result = await useMock(
    () => mockPupUpdatesApi.getPreviousVersion(pupId),
    () => client.get(`/pup/${pupId}/previous-version`),
    'getPreviousVersion'
  )();
  console.log('[PupUpdates API] getPreviousVersion result:', result);
  return result;
}

// Skip pup update (handled in frontend only, no API call needed)
export function skipPupUpdate(pupId) {
  console.log(`[PupUpdates API] skipPupUpdate called for pupId=${pupId}`);
  // This is handled purely in the frontend via pupUpdates.skipUpdate()
  return { success: true };
}
