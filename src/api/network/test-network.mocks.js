const MOCK_CONFIG_KEY = "dpanel:mockNetworkTest";

const defaultMockConfig = {
  simulateOffline: false,
  simulateOnline: true,
};

function normalizeMockConfig(config = {}) {
  const normalized = {
    ...defaultMockConfig,
    ...(config || {}),
  };

  if (normalized.simulateOffline && normalized.simulateOnline) {
    normalized.simulateOnline = false;
  }

  return normalized;
}

export function getMockConfig() {
  try {
    const stored = localStorage.getItem(MOCK_CONFIG_KEY);
    if (!stored) {
      return { ...defaultMockConfig };
    }

    const parsed = JSON.parse(stored);
    if ("simulateOffline" in parsed && !("hasInternetConnectivity" in parsed)) {
      return normalizeMockConfig(parsed);
    }

    if ("hasInternetConnectivity" in parsed) {
      return normalizeMockConfig({
        simulateOffline: !parsed.hasInternetConnectivity,
        simulateOnline: parsed.hasInternetConnectivity,
      });
    }

    return normalizeMockConfig(parsed);
  } catch (error) {
    console.error("[NetworkTest Mock] Failed to load config:", error);
    return { ...defaultMockConfig };
  }
}

export function saveMockConfig(config) {
  try {
    localStorage.setItem(MOCK_CONFIG_KEY, JSON.stringify(normalizeMockConfig(config)));
  } catch (error) {
    console.error("[NetworkTest Mock] Failed to save config:", error);
  }
}

export function resetMockConfig() {
  localStorage.removeItem(MOCK_CONFIG_KEY);
}

function generateNetworkTestResponse() {
  const config = getMockConfig();
  const hasInternetConnectivity = !config.simulateOffline;

  return {
    success: true,
    hasInternetConnectivity,
    message: hasInternetConnectivity
      ? "Network Connection Test Success"
      : "Network connected but internet unavailable",
  };
}

export const postResponse = {
  name: "/system/network/test",
  method: "post",
  group: "networks",
  alwaysInterceptWhenMocksEnabled: true,
  res: generateNetworkTestResponse,
};

export const postResponseError = {
  success: false,
  error: "broke",
  message: "Network Connection Test Fail",
};
