import ApiClient from '/api/client.js';
import { store } from '/state/store.js'
import { pkgController } from '/controllers/package/index.js';
import { mock } from './bootstrap.mocks.js'
import { mockV2 } from './bootstrap.mocks.v2.js'

const client = new ApiClient(store.networkContext.apiBaseUrl);

export async function getBootstrap() {
  return client.get('/setup/bootstrap', { mock });
}

export async function getBootstrapV2(config = {}) {
  const hooks = config.hooks || [bumpVersionHook];
  return client.get('/system/bootstrap', { ...config, mock: mockV2, hooks })
}

export async function doBootstrap() {
  return pkgController.setData(await getBootstrapV2());
}

// Response hooks
const bumpVersionHook = {
  'bump-version': (payload) => {
    if (payload?.version) { payload.version.release = "v.9000" }
    return payload
  }
}