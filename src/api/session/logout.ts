import ApiClient from "/api/client.js";
import { store } from "/state/store.js";

const client = new ApiClient(store.networkContext.apiBaseUrl);

export async function postLogout() {
  // A stale or absent token is already logged out from the service's perspective.
  // Do not let the API client's normal 401 handling navigate back to /logout and
  // recursively invoke the route middleware.
  return client.post<{ success: boolean }>("/logout", undefined, {
    noLogoutRedirect: true,
  });
}
