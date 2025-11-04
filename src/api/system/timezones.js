import ApiClient from "/api/client.js";
import { store } from "/state/store.js";

import { getResponse, postResponse } from "./timezones.mocks.js";

const client = new ApiClient(store.networkContext.apiBaseUrl);

export async function getTimezones() {
  const res = await client.get(`/system/timezones`, {
    noLogoutRedirect: true,
    mock: getResponse,
  });
  return res;
}

export async function setTimezone({ timezone }) {
  const res = await client.post(`/system/timezone`, { timezone }, {
    noLogoutRedirect: true,
    mock: postResponse,
  });
  return res;
}
