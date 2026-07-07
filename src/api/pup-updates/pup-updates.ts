import ApiClient from '/api/client.js';
import { store } from '/state/store.js';
import { mockPupUpdatesApi } from './pup-updates.mocks.js';
import type { PupUpdateInfo } from '/types/pup-updates';

const client = new ApiClient(store.networkContext.apiBaseUrl);

// Helper to choose mock or real
function useMock<T>(mockFn: () => Promise<T>, realFn: () => Promise<T>, fnName?: string): () => Promise<T> {
  const useMocks = store.networkContext.useMocks;
  return useMocks ? mockFn : realFn;
}

// GET all pup updates
export async function getAllPupUpdates(): Promise<Record<string, PupUpdateInfo>> {
  const result = await useMock(
    // The mock returns Date objects where the wire format uses strings;
    // downstream consumers pass both through new Date().
    () => mockPupUpdatesApi.getAllPupUpdates() as unknown as Promise<Record<string, PupUpdateInfo>>,
    () => client.get<Record<string, PupUpdateInfo>>('/pup/updates'),
    'getAllPupUpdates'
  )();
  return result;
}

// GET updates for specific pup
export async function getPupUpdate(pupId: string): Promise<PupUpdateInfo> {
  const result = await useMock(
    () => mockPupUpdatesApi.getPupUpdate(pupId) as unknown as Promise<PupUpdateInfo>,
    () => client.get<PupUpdateInfo>(`/pup/${pupId}/updates`),
    'getPupUpdate'
  )();
  return result;
}

// Force check for pup updates
export async function checkPupUpdates(pupId: string) {
  const result = await useMock(
    () => mockPupUpdatesApi.checkPupUpdates(pupId),
    () => client.post(`/pup/${pupId}/check-pup-updates`),
    'checkPupUpdates'
  )();
  return result;
}

// Upgrade pup to a specific version
export async function upgradePup(pupId: string, targetVersion?: string) {
  const result = await useMock(
    () => mockPupUpdatesApi.upgradePup(pupId, targetVersion),
    () => client.post(`/pup/${pupId}/upgrade`, { targetVersion }),
    'upgradePup'
  )();
  return result;
}

/** GET /pup/:pupId/previous-version response (dogeboxd pkg/web/pup_updates.go). */
export interface PreviousVersionResponse {
  pupId?: string;
  currentVersion?: string;
  previousVersion?: string;
  isBroken?: boolean;
  brokenReason?: string;
  hasSnapshot?: boolean;
  rollbackPossible?: boolean;
}

// Rollback pup to previous version
export async function rollbackPup(pupId: string) {
  const result = await useMock(
    () => mockPupUpdatesApi.rollbackPup(pupId) as Promise<{ jobId?: string }>,
    () => client.post<{ jobId?: string }>(`/pup/${pupId}/rollback`),
    'rollbackPup'
  )();
  return result;
}

// Get previous version info (for rollback)
export async function getPreviousVersion(pupId: string) {
  const result = await useMock(
    // The mock returns a snapshot object rather than the wire shape.
    () => mockPupUpdatesApi.getPreviousVersion(pupId) as unknown as Promise<PreviousVersionResponse>,
    () => client.get<PreviousVersionResponse>(`/pup/${pupId}/previous-version`),
    'getPreviousVersion'
  )();
  return result;
}

// Get all skipped updates
export async function getSkippedUpdates(): Promise<Record<string, string>> {
  const result = await useMock(
    () => mockPupUpdatesApi.getSkippedUpdates(),
    () => client.get<Record<string, string>>('/pup/skipped-updates'),
    'getSkippedUpdates'
  )();
  return result;
}

// Skip pup update (now persisted to backend)
export async function skipPupUpdate(pupId: string) {
  const result = await useMock(
    () => mockPupUpdatesApi.skipPupUpdate(pupId),
    () => client.post(`/pup/${pupId}/skip-update`),
    'skipPupUpdate'
  )();
  return result;
}

// Clear skipped update for a pup
export async function clearSkippedUpdate(pupId: string) {
  const result = await useMock(
    () => mockPupUpdatesApi.clearSkippedUpdate(pupId),
    () => client.delete(`/pup/${pupId}/skip-update`),
    'clearSkippedUpdate'
  )();
  return result;
}
