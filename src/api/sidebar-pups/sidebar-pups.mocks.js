const MOCK_CONFIG_KEY = "dpanel:mockSidebarPups";

const ADJECTIVES = [
  "Amber",
  "Brave",
  "Cosmic",
  "Daring",
  "Electric",
  "Fuzzy",
  "Golden",
  "Happy",
  "Icy",
  "Jolly",
  "Lucky",
  "Mighty",
  "Neon",
  "Proud",
  "Rapid",
  "Silver",
  "Sunny",
  "Swift",
  "Turbo",
  "Velvet",
];

const NOUNS = [
  "Badger",
  "Comet",
  "Dingo",
  "Falcon",
  "Gadget",
  "Harbor",
  "Lantern",
  "Mango",
  "Nimbus",
  "Orbit",
  "Panda",
  "Quartz",
  "Rocket",
  "Signal",
  "Tundra",
  "Voyager",
  "Willow",
  "Yonder",
  "Zephyr",
  "Beacon",
];

const LONG_SUFFIXES = [
  "Integration Dashboard Service",
  "Companion Interface Extension",
  "Long Name Overflow Validation",
];

const defaultMockConfig = {
  pups: [],
};

function randomFrom(list) {
  return list[Math.floor(Math.random() * list.length)];
}

export function generateRandomPupName() {
  const base = `${randomFrom(ADJECTIVES)} ${randomFrom(NOUNS)}`;
  const makeLong = Math.random() < 0.2;
  return makeLong ? `${base} ${randomFrom(LONG_SUFFIXES)}` : base;
}

function generateRandomIconColor() {
  const hue = Math.floor(Math.random() * 360);
  return `hsl(${hue} 80% 60%)`;
}

function createSidebarPup(name = generateRandomPupName()) {
  return {
    id: `mock-sidebar-pup-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name,
    iconColor: generateRandomIconColor(),
  };
}

function normalizePup(pup) {
  if (!pup || typeof pup !== "object") return null;
  const id = typeof pup.id === "string" ? pup.id.trim() : "";
  const name = typeof pup.name === "string" ? pup.name.trim() : "";
  const iconColor = typeof pup.iconColor === "string" && pup.iconColor.trim()
    ? pup.iconColor.trim()
    : generateRandomIconColor();
  if (!id || !name) return null;
  return { id, name, iconColor };
}

function normalizeConfig(config) {
  const source = config && typeof config === "object" ? config : {};
  const pups = Array.isArray(source.pups) ? source.pups : [];
  return {
    pups: pups.map(normalizePup).filter(Boolean),
  };
}

export function getMockConfig() {
  try {
    const stored = localStorage.getItem(MOCK_CONFIG_KEY);
    if (!stored) return { ...defaultMockConfig };
    const parsed = JSON.parse(stored);
    return normalizeConfig(parsed);
  } catch (error) {
    console.error("[SidebarPups Mock] Failed to load mock sidebar pup config:", error);
    return { ...defaultMockConfig };
  }
}

export function saveMockConfig(config) {
  try {
    localStorage.setItem(MOCK_CONFIG_KEY, JSON.stringify(normalizeConfig(config)));
  } catch (error) {
    console.error("[SidebarPups Mock] Failed to save mock sidebar pup config:", error);
  }
}

export function resetMockConfig() {
  localStorage.removeItem(MOCK_CONFIG_KEY);
}

export function addMockPups(count = 1) {
  const config = getMockConfig();
  const safeCount = Number.isInteger(count) && count > 0 ? count : 1;
  const nextPups = [...config.pups];

  for (let i = 0; i < safeCount; i += 1) {
    if (i < 2 && safeCount >= 5) {
      const longName = `${randomFrom(ADJECTIVES)} ${randomFrom(NOUNS)} ${randomFrom(LONG_SUFFIXES)}`;
      nextPups.push(createSidebarPup(longName));
      continue;
    }
    nextPups.push(createSidebarPup());
  }

  const nextConfig = { ...config, pups: nextPups };
  saveMockConfig(nextConfig);
  return nextConfig;
}

export function removeMockPup(id) {
  const config = getMockConfig();
  const nextConfig = {
    ...config,
    pups: config.pups.filter((pup) => pup.id !== id),
  };
  saveMockConfig(nextConfig);
  return nextConfig;
}

export function renameMockPup(id, name) {
  const nextName = (name || "").trim();
  if (!nextName) return getMockConfig();

  const config = getMockConfig();
  const nextConfig = {
    ...config,
    pups: config.pups.map((pup) => (pup.id === id ? { ...pup, name: nextName } : pup)),
  };
  saveMockConfig(nextConfig);
  return nextConfig;
}

export function clearMockPups() {
  const nextConfig = { pups: [] };
  saveMockConfig(nextConfig);
  return nextConfig;
}
