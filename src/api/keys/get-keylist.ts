import ApiClient from "/api/client.js";
import { store } from "/state/store.js";

import { getResponse } from "./get-keylist.mocks.js";

const client = new ApiClient(store.networkContext.apiBaseUrl);

export async function getKeylist() {
  const res = await client.get(`/keys`, { mock: getResponse });
  return res;
}
