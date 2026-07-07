import ApiClient from '/api/client.js';
import { store } from '/state/store.js';
import { mock } from './system.mocks.js';

const client = new ApiClient(store.networkContext.apiBaseUrl);

/** A single system stat series (cpu/ram/disk) from GET /system/stats. */
export interface SystemStatSeries {
  label?: string;
  type?: string;
  values?: number[];
  current?: number;
  used?: number;
  total?: number;
}

export interface SystemStatsResponse {
  cpu?: SystemStatSeries;
  ram?: SystemStatSeries;
  disk?: SystemStatSeries;
}

export async function getSystemStats() {
  const result = await client.get<{ error?: unknown; status?: number } & SystemStatsResponse>('/system/stats', { mock, noLogoutRedirect: true });
  // Handle auth errors gracefully
  if (result?.error && result?.status === 401) {
    throw new Error('Authentication required for system stats');
  }
  return result;
}

