import ApiClient from '/api/client.js';
import { store } from '/state/store.js'
import type { MockDescriptor } from '/api/client.js';

export const sourceRemovalMock: MockDescriptor = {
  name: '/source/:sourceid',
  method: 'delete',
  group: 'sources',
  res: { success: true }
}

export const sourceAddMock: MockDescriptor = {
  name: '/source/:sourceid',
  method: 'put',
  group: 'sources',
  res: { success: true }
}

const client = new ApiClient(store.networkContext.apiBaseUrl)

export async function removeSource(sourceId: string) {
  return client.delete(`/source/${sourceId}`, null, { mock: sourceRemovalMock });
}

export async function addSource(location: string) {
  return client.put(`/source`, { location }, { mock: sourceAddMock });
}