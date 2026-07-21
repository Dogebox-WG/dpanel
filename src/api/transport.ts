import { createConnectTransport } from "@connectrpc/connect-web";
import type { Interceptor } from "@connectrpc/connect";
import { store } from "/state/store.js";

const authInterceptor: Interceptor = (next) => async (req) => {
  const token = store.networkContext?.token;
  if (token) {
    req.header.set("Authorization", `Bearer ${token}`);
  }
  return await next(req);
};

export function getTransport() {
  return createConnectTransport({
    baseUrl: store.networkContext.apiBaseUrl,
    interceptors: [authInterceptor],
  });
}
