import ApiClient from "/api/client.js";
import { store } from "/state/store.js";

import { postResponse } from "./test-network.mocks.js";

const client = new ApiClient(store.networkContext.apiBaseUrl);

export async function testNetwork(body) {
  const res = await client.put(`/system/network/test`, body, {
    mock: postResponse,
  });
  return res;
}
