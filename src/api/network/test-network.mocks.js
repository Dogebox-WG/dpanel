const MOCK_CONFIG_KEY = "dpanel:mockNetworkTest";

const defaultMockConfig = {
  hasInternetConnectivity: true,
};

export function getMockConfig() {
  try {
    const stored = localStorage.getItem(MOCK_CONFIG_KEY);
    if (!stored) {
      return { ...defaultMockConfig };
    }

    return { ...defaultMockConfig, ...JSON.parse(stored) };
  } catch (error) {
    console.error("[NetworkTest Mock] Failed to load config:", error);
    return { ...defaultMockConfig };
  }
}

export function saveMockConfig(config) {
  try {
    localStorage.setItem(MOCK_CONFIG_KEY, JSON.stringify({
      ...defaultMockConfig,
      ...(config || {}),
    }));
  } catch (error) {
    console.error("[NetworkTest Mock] Failed to save config:", error);
  }
}

export function resetMockConfig() {
  localStorage.removeItem(MOCK_CONFIG_KEY);
}

function generateNetworkTestResponse() {
  const config = getMockConfig();

  return {
    success: true,
    hasInternetConnectivity: config.hasInternetConnectivity,
    message: config.hasInternetConnectivity
      ? "Network Connection Test Success"
      : "Network connected but internet unavailable",
  };
}

export const postResponse = {
  name: "/system/network/test",
  method: "post",
  group: "networks",
  res: generateNetworkTestResponse,
};

export const postResponseError = {
  success: false,
  error: "broke",
  message: "Network Connection Test Fail",
};
