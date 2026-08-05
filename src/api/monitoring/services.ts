import ApiClient from '/api/client.js';
import { store } from '/state/store.js';
import { mock } from './services.mocks.js';

const client = new ApiClient(store.networkContext.apiBaseUrl);

/** A monitorable system service entry from GET /system/services. */
export interface MonitoringService {
  id: string;
  name?: string;
  configured?: boolean;
  [key: string]: unknown;
}

export async function getAvailableServices() {
  const result = await client.get<{ error?: unknown; status?: number; available?: MonitoringService[] }>('/system/services', { mock, noLogoutRedirect: true });
  // Handle auth errors gracefully
  if (result?.error && result?.status === 401) {
    throw new Error('Authentication required for services');
  }
  return result;
}

