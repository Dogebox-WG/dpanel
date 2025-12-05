import ApiClient from '/api/client.js';
import { store } from '/state/store.js';
import { mockPupUpdatesApi } from './pup-updates.mocks.js';

const client = new ApiClient(store.networkContext.apiBaseUrl);

// Helper to choose mock or real
function useMock(mockFn, realFn, fnName) {
  const useMocks = store.networkContext.useMocks;
  return useMocks ? mockFn : realFn;
}

// GET all pup updates
export async function getAllPupUpdates() {
  const result = await useMock(
    () => mockPupUpdatesApi.getAllPupUpdates(),
    () => client.get('/pup/updates'),
    'getAllPupUpdates'
  )();
  return result;
}

// GET updates for specific pup
export async function getPupUpdate(pupId) {
  const result = await useMock(
    () => mockPupUpdatesApi.getPupUpdate(pupId),
    () => client.get(`/pup/${pupId}/updates`),
    'getPupUpdate'
  )();
  return result;
}

// Force check for pup updates
export async function checkPupUpdates(pupId) {
  const result = await useMock(
    () => mockPupUpdatesApi.checkPupUpdates(pupId),
    () => client.post(`/pup/${pupId}/check-pup-updates`),
    'checkPupUpdates'
  )();
  return result;
}

// Upgrade pup to a specific version
export async function upgradePup(pupId, targetVersion) {
  const result = await useMock(
    () => mockPupUpdatesApi.upgradePup(pupId, targetVersion),
    () => client.post(`/pup/${pupId}/upgrade`, { targetVersion }),
    'upgradePup'
  )();
  return result;
}

// Rollback pup to previous version
export async function rollbackPup(pupId) {
  const result = await useMock(
    () => mockPupUpdatesApi.rollbackPup(pupId),
    () => client.post(`/pup/${pupId}/rollback`),
    'rollbackPup'
  )();
  return result;
}

// Get previous version info (for rollback)
export async function getPreviousVersion(pupId) {
  const result = await useMock(
    () => mockPupUpdatesApi.getPreviousVersion(pupId),
    () => client.get(`/pup/${pupId}/previous-version`),
    'getPreviousVersion'
  )();
  return result;
}

// Get all skipped updates
export async function getSkippedUpdates() {
  const result = await useMock(
    () => mockPupUpdatesApi.getSkippedUpdates(),
    () => client.get('/pup/skipped-updates'),
    'getSkippedUpdates'
  )();
  return result;
}

// Skip pup update (now persisted to backend)
export async function skipPupUpdate(pupId) {
  const result = await useMock(
    () => mockPupUpdatesApi.skipPupUpdate(pupId),
    () => client.post(`/pup/${pupId}/skip-update`),
    'skipPupUpdate'
  )();
  return result;
}

// Clear skipped update for a pup
export async function clearSkippedUpdate(pupId) {
  const result = await useMock(
    () => mockPupUpdatesApi.clearSkippedUpdate(pupId),
    () => client.delete(`/pup/${pupId}/skip-update`),
    'clearSkippedUpdate'
  )();
  return result;
}
