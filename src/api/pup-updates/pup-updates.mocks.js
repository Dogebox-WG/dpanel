// Mock API for pup updates with configurable settings
import { store } from '/state/store.js';
import { pkgController } from '/controllers/package/index.js';

const MOCK_CONFIG_KEY = 'dpanel:mockPupUpdates';

// Default mock configuration
const defaultMockConfig = {
  latestVersion: '1.2.0',
  currentVersion: '1.0.0',
  updateAvailable: true,
  availableVersions: [
    {
      version: '1.2.0',
      releaseNotes: '## What\'s New\n\n- Added new features\n- Fixed bugs\n- Improved performance',
      releaseDate: '2024-01-15',
    },
    {
      version: '1.1.0',
      releaseNotes: '## Updates\n\n- Minor improvements\n- Bug fixes',
      releaseDate: '2024-01-10',
    }
  ]
};

// Get the current mock configuration
export function getMockConfig() {
  try {
    const stored = localStorage.getItem(MOCK_CONFIG_KEY);
    console.log('[PupUpdates Mock] getMockConfig - stored:', stored);
    if (stored) {
      const parsed = { ...defaultMockConfig, ...JSON.parse(stored) };
      console.log('[PupUpdates Mock] getMockConfig - returning parsed:', parsed);
      return parsed;
    }
  } catch (e) {
    console.error('[PupUpdates Mock] Failed to load mock pup update config:', e);
  }
  console.log('[PupUpdates Mock] getMockConfig - returning defaults:', defaultMockConfig);
  return defaultMockConfig;
}

// Save mock configuration
export function saveMockConfig(config) {
  try {
    console.log('[PupUpdates Mock] saveMockConfig:', config);
    localStorage.setItem(MOCK_CONFIG_KEY, JSON.stringify(config));
  } catch (e) {
    console.error('[PupUpdates Mock] Failed to save mock pup update config:', e);
  }
}

// Reset to defaults
export function resetMockConfig() {
  console.log('[PupUpdates Mock] resetMockConfig called');
  localStorage.removeItem(MOCK_CONFIG_KEY);
}

// Build available versions array with full details
function buildAvailableVersions(config) {
  // Start with the explicit available versions
  let versions = config.availableVersions.map(v => ({
    version: v.version,
    releaseNotes: v.releaseNotes || `## Version ${v.version}\n\nNo release notes provided.`,
    releaseDate: new Date(v.releaseDate || Date.now()),
    releaseUrl: `https://github.com/example/pup/releases/tag/v${v.version}`,
    breakingChanges: [],
    interfaceChanges: []
  }));
  
  // Ensure the latestVersion is in the list
  const hasLatest = versions.some(v => v.version === config.latestVersion);
  if (!hasLatest && config.latestVersion) {
    versions.unshift({
      version: config.latestVersion,
      releaseNotes: `## Version ${config.latestVersion}\n\nLatest release with improvements and bug fixes.`,
      releaseDate: new Date(),
      releaseUrl: `https://github.com/example/pup/releases/tag/v${config.latestVersion}`,
      breakingChanges: [],
      interfaceChanges: []
    });
  }
  
  console.log('[PupUpdates Mock] buildAvailableVersions:', versions);
  return versions;
}

// Get all installed pup IDs from pkgController
function getInstalledPupIds() {
  try {
    const pups = pkgController.pups;
    console.log('[PupUpdates Mock] getInstalledPupIds - pkgController.pups:', pups);
    
    if (pups && pups.length > 0) {
      // Return IDs of pups that have state (i.e., are installed)
      const ids = pups
        .filter(pup => {
          const hasState = pup.state && pup.state.id;
          console.log('[PupUpdates Mock] getInstalledPupIds - checking pup:', pup?.state?.manifest?.meta?.name, 'hasState:', hasState);
          return hasState;
        })
        .map(pup => pup.state.id);
      
      console.log('[PupUpdates Mock] getInstalledPupIds - found IDs:', ids);
      return ids;
    }
  } catch (e) {
    console.error('[PupUpdates Mock] Failed to get installed pup IDs:', e);
  }
  console.log('[PupUpdates Mock] getInstalledPupIds - returning empty array');
  return [];
}

export const mockPupUpdatesApi = {
  getAllPupUpdates: async () => {
    console.log('[PupUpdates Mock] getAllPupUpdates called');
    await new Promise(resolve => setTimeout(resolve, 500));
    const config = getMockConfig();
    
    // Get actual installed pup IDs and return mock update data for each
    const pupIds = getInstalledPupIds();
    console.log('[PupUpdates Mock] getAllPupUpdates - pupIds to mock:', pupIds);
    
    const result = {};
    
    for (const pupId of pupIds) {
      result[pupId] = {
        pupId: pupId,
        currentVersion: config.currentVersion,
        latestVersion: config.latestVersion,
        availableVersions: buildAvailableVersions(config),
        updateAvailable: config.updateAvailable,
        lastChecked: new Date()
      };
    }
    
    console.log('[PupUpdates Mock] getAllPupUpdates - returning:', result);
    return result;
  },

  getPupUpdate: async (pupId) => {
    console.log('[PupUpdates Mock] getPupUpdate called for pupId:', pupId);
    await new Promise(resolve => setTimeout(resolve, 300));
    const config = getMockConfig();
    
    const result = {
      pupId: pupId,
      currentVersion: config.currentVersion,
      latestVersion: config.latestVersion,
      availableVersions: buildAvailableVersions(config),
      updateAvailable: config.updateAvailable,
      lastChecked: new Date()
    };
    
    console.log('[PupUpdates Mock] getPupUpdate - returning:', result);
    return result;
  },

  checkPupUpdates: async (pupId) => {
    console.log('[PupUpdates Mock] checkPupUpdates called for pupId:', pupId);
    await new Promise(resolve => setTimeout(resolve, 1000));
    const result = { jobId: 'job-' + Math.random().toString(36).substr(2, 9) };
    console.log('[PupUpdates Mock] checkPupUpdates - returning:', result);
    return result;
  },

  upgradePup: async (pupId, targetVersion) => {
    console.log('[PupUpdates Mock] upgradePup called for pupId:', pupId, 'targetVersion:', targetVersion);
    await new Promise(resolve => setTimeout(resolve, 500));
    const result = { jobId: 'job-' + Math.random().toString(36).substr(2, 9) };
    console.log('[PupUpdates Mock] upgradePup - returning:', result);
    return result;
  },

  rollbackPup: async (pupId) => {
    console.log('[PupUpdates Mock] rollbackPup called for pupId:', pupId);
    await new Promise(resolve => setTimeout(resolve, 500));
    const result = { jobId: 'job-' + Math.random().toString(36).substr(2, 9) };
    console.log('[PupUpdates Mock] rollbackPup - returning:', result);
    return result;
  },

  getPreviousVersion: async (pupId) => {
    console.log('[PupUpdates Mock] getPreviousVersion called for pupId:', pupId);
    await new Promise(resolve => setTimeout(resolve, 300));
    const result = {
      version: '0.9.0',
      manifest: {
        meta: {
          name: 'Example Pup',
          version: '0.9.0'
        }
      },
      config: {},
      providers: {},
      enabled: true,
      snapshotDate: new Date('2024-01-01'),
      sourceId: 'source-123',
      sourceLocation: 'https://github.com/example/pup'
    };
    console.log('[PupUpdates Mock] getPreviousVersion - returning:', result);
    return result;
  }
};
