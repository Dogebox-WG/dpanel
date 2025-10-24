// Mock API for pup updates
export const mockPupUpdatesApi = {
  getAllPupUpdates: async () => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return {
      'pup-id-123': {
        pupId: 'pup-id-123',
        currentVersion: '1.0.0',
        latestVersion: '1.2.0',
        availableVersions: [
          {
            version: '1.2.0',
            releaseNotes: '## What\'s New\n\n- Added new features\n- Fixed bugs\n- Improved performance',
            releaseDate: new Date('2024-01-15'),
            releaseUrl: 'https://github.com/example/pup/releases/tag/v1.2.0',
            breakingChanges: [],
            interfaceChanges: []
          },
          {
            version: '1.1.0',
            releaseNotes: '## Updates\n\n- Minor improvements\n- Bug fixes',
            releaseDate: new Date('2024-01-10'),
            releaseUrl: 'https://github.com/example/pup/releases/tag/v1.1.0',
            breakingChanges: [],
            interfaceChanges: []
          }
        ],
        updateAvailable: true,
        lastChecked: new Date()
      }
    };
  },

  getPupUpdate: async (pupId) => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return {
      pupId: pupId,
      currentVersion: '1.0.0',
      latestVersion: '1.2.0',
      availableVersions: [
        {
          version: '1.2.0',
          releaseNotes: '## What\'s New\n\n- Added new features\n- Fixed bugs\n- Improved performance',
          releaseDate: new Date('2024-01-15'),
          releaseUrl: 'https://github.com/example/pup/releases/tag/v1.2.0',
          breakingChanges: [],
          interfaceChanges: []
        }
      ],
      updateAvailable: true,
      lastChecked: new Date()
    };
  },

  checkPupUpdates: async (pupId) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return { jobId: 'job-' + Math.random().toString(36).substr(2, 9) };
  },

  updatePup: async (pupId, targetVersion) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return { jobId: 'job-' + Math.random().toString(36).substr(2, 9) };
  },

  rollbackPup: async (pupId, targetVersion) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return { jobId: 'job-' + Math.random().toString(36).substr(2, 9) };
  },

  getPreviousVersion: async (pupId) => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return {
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
  }
};

