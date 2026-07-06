import { store } from "/state/store.js";
import type { NetworkContext } from "/state/store.js";
import { ReactiveClass } from "/utils/class-reactive.js";
import { StoreSubscriber } from "/state/subscribe.js";
import { hookManager } from "./hooks.js";
import type { ResponseHook } from "./hooks.js";

/** Options passed to a mock descriptor's res() function. */
export interface MockResOptions {
  forceFailures: boolean;
  body?: unknown;
  method?: string;
  networkContext: NetworkContext;
}

/**
 * A mocked endpoint descriptor (see the *.mocks.js modules). `res` is
 * either a static payload or a function deriving one per request.
 */
export interface MockDescriptor {
  /** Endpoint label shown in the debug settings panel, eg "/authenticate". */
  name: string;
  /** Toggle group shown in the debug settings panel, eg "auth". */
  group: string;
  method: string;
  res: unknown | ((path: string, opts: MockResOptions) => unknown);
}

export interface RequestConfig {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
  mock?: MockDescriptor;
  hooks?: ResponseHook[];
  /** Return the 401 payload rather than redirecting to /logout. */
  noLogoutRedirect?: boolean;
}

export interface ApiClientOptions {
  /** Calls to third-party APIs skip auth headers and base-url overrides. */
  externalAPI?: boolean;
}

export default class ApiClient extends ReactiveClass {
  baseURL: string;
  context: StoreSubscriber;
  networkContext: NetworkContext;
  options: ApiClientOptions;

  constructor(baseURL: string, options: ApiClientOptions = {}) {
    super();
    this.baseURL = baseURL;

    this.context = new StoreSubscriber(this, store);
    this.networkContext = this.context.store.networkContext;
    this.options = options;

    if (this.networkContext && this.networkContext.overrideBaseUrl && !this.options.externalAPI) {
      this.baseURL = this.networkContext.apiBaseUrl || "http://nope.localhost:6969";
    }
  }

  requestUpdate(): void {
    super.requestUpdate();
    this.networkContext = this.context.store.networkContext;
  }

  async get<T = unknown>(path: string, config: RequestConfig = {}): Promise<T> {
    return this.request(path, { ...config, method: "GET" });
  }

  async post<T = unknown>(path: string, body?: unknown, config: RequestConfig = {}): Promise<T> {
    return this.request(path, { ...config, method: "POST", body });
  }

  async put<T = unknown>(path: string, body?: unknown, config: RequestConfig = {}): Promise<T> {
    return this.request(path, { ...config, method: "PUT", body });
  }

  async delete<T = unknown>(path: string, body?: unknown, config: RequestConfig = {}): Promise<T> {
    return this.request(path, { ...config, method: "DELETE", body });
  }

  async request<T = unknown>(path: string, config: RequestConfig): Promise<T> {
    // if config.body is an empty object, remove the property.
    // this is to prevent the browser from sending an empty body to the server
    // which is not what we want.
    let serialisedBody: string | undefined;
    if (Object.keys((config.body as object) || {}).length === 0) {
      delete config.body;
    } else {
      serialisedBody = JSON.stringify(config.body);
    }

    // Debug, if the dev has forceDelay, wait the delay time in seconds before making request
    if (this.networkContext.forceDelayInSeconds) {
      await new Promise((resolve) => setTimeout(resolve, this.networkContext.forceDelayInSeconds * 1000));
    }

    // If mocks enabled, avoid making legitimate request, return mocked response (success or error) instead.
    const hasMock = !!config.mock;
    const useMocks = this.networkContext.useMocks;
    const specificMockEnabled = hasMock && useMocks && isMockEnabled(config.mock!.group, config.mock!.name, config.mock!.method, this.networkContext);
    if (useMocks && hasMock && specificMockEnabled) {
      return await returnMockedResponse(path, config, this.networkContext) as T;
    }

    // Otherwise, perform the fetch request
    const url = new URL(path, this.baseURL).href;
    const headers: Record<string, string> = { "Content-Type": "application/json", ...config.headers };

    if (this.networkContext.token && !this.options.externalAPI) {
      headers.Authorization = `Bearer ${this.networkContext.token}`;
    }

    let response: Response, data: T;

    try {
      response = await fetch(url, { ...config, body: serialisedBody, headers });
    } catch (fetchErr) {
      throw new Error("An error occurred while fetching data, refer to network logs");
    }

    if (response.status === 404) {
      throw new Error(`Resource not found: ${url}`);
    }

    if (response.status === 403) {
      return { success: false, error: true, status: 403 } as T;
    }

    if (response.status === 401) {
      if (config.noLogoutRedirect) {
        return { success: false, error: true, status: 401 } as T;
      } else {
        return (window.location.href = window.location.origin + "/logout") as T;
      }
    }

    if (!response.ok) {
      console.warn("Unsuccessful respose", { status: response.status });
      throw new Error(`Request failed with error code: ${response.status}`);
    }

    // Parse JSON body
    try {
      data = await response.json();
    } catch (jsonParseErr) {
      console.warn("Could not JSON parse response from server", jsonParseErr);
      throw new Error("Could not JSON parse response from server");
    }

    // Return payload, unmodified.
    if (!config.hooks) {
      return data;
    }

    // Process response hooks (dev tool)
    // iterate over hooks
    // if hook enabled, process and return adusted data.
    // if hook not enabled, return unmodified data.
    try {
      return hookManager.process(config.hooks, data) as T;
    } catch (hookProcessingErr) {
      console.warn("Hook failed to process with the following error:", hookProcessingErr);
      console.log("Returning unmodified data");
      return data;
    }
  }
}

async function returnMockedResponse(
  path: string,
  config: RequestConfig,
  networkContext: NetworkContext,
): Promise<unknown> {

  const { forceFailures, reqLogs } = networkContext;

  reqLogs && console.group("Mock Request", path);
  reqLogs && console.log(`Req (${config.method}):`, config.body || "--no-body");

  const mock = config.mock!;
  const response = (typeof mock.res === "function")
    ? mock.res(path, { forceFailures, body: config.body, method: config.method, networkContext })
    : getMockedSuccessOrError(path, mock.res, forceFailures);
  reqLogs && console.log("Res:", response);
  reqLogs && console.groupEnd();

  return response;
}

function getMockedSuccessOrError(path: string, mock: unknown, forceFailures: boolean): unknown {
  // When forcing failure
  if (forceFailures) {
    throw new Error(`Simulated error returned from ${path}`);
  }
  return mock;
}

function isMockEnabled(
  group: string,
  name: string,
  method: string,
  networkContext: NetworkContext,
): boolean {
  if (!group || !name || !method) {
    console.warn("Mock check was provided invalid group, name or method", { group, name, method });
    return false;
  }

  return Boolean(networkContext[`mock::${group}::${name}::${method}`]);
}
