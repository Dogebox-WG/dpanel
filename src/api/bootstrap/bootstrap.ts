import ApiClient from '/api/client.js';
import { store } from '/state/store.js'
import { pkgController } from '/controllers/package/index.js';
import { mock } from './bootstrap.mocks.js'
import { mockV2 } from './bootstrap.mocks.v2.js'
import type { ResponseHook } from '/api/hooks.js';
import type { BootstrapResponse } from '/types/bootstrap';

const client = new ApiClient(store.networkContext.apiBaseUrl);

export async function getBootstrap() {
  return client.get('/setup/bootstrap', { mock });
}

export async function getBootstrapV2() {
  return client.get<BootstrapResponse>('/system/bootstrap', { mock: mockV2, hooks: [bumpVersionHook]})
}

export async function doBootstrap() {
  return pkgController.setData(await getBootstrapV2());
}

interface VersionPayload {
  version?: { release?: string };
}

function hasVersion(payload: unknown): payload is VersionPayload {
  return !!payload && typeof payload === "object";
}

// Response hooks
const bumpVersionHook: ResponseHook = {
  'bump-version': (payload) => {
    if (hasVersion(payload) && payload.version) { payload.version.release = "v.9000" }
    return payload
  }
}