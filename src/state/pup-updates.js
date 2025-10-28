import { getAllPupUpdates } from '/api/pup-updates/pup-updates.js';
import { store } from '/state/store.js';

const IGNORED_UPDATES_STORAGE_KEY = 'dpanel:ignoredUpdates';

/**
 * Pup update state management.
 * The backend (dogeboxd) handles periodic update checking and caching.
 * This module fetches cached data from the backend and updates the frontend store,
 * and manages locally ignored updates.
 */
class PupUpdates {
  constructor() {
    this.ignoredUpdates = this._loadIgnored();
  }

  /**
   * Initialize - fetches initial cached update info from backend
   */
  async init() {
    console.log('PupUpdates: Initializing...');
    
    // Fetch initial cached update info from backend
    await this.refresh();
  }

  /**
   * Fetch cached update info from backend and update the store.
   * Note: The backend handles periodic checking automatically.
   * This just fetches the current cached state.
   */
  async refresh() {
    try {
      console.log('PupUpdates: Fetching cached update info from backend...');
      const updateInfo = await getAllPupUpdates();
      
      // Count total updates available
      let totalUpdatesAvailable = 0;
      for (const pupId in updateInfo) {
        if (updateInfo[pupId].updateAvailable) {
          totalUpdatesAvailable++;
        }
      }
      
      // Update the store
      store.updateState({
        pupUpdatesContext: {
          updateInfo,
          lastChecked: new Date().toISOString(),
          totalUpdatesAvailable
        }
      });
      
      console.log(`PupUpdates: Found ${totalUpdatesAvailable} pup(s) with updates available`);
    } catch (error) {
      console.error('PupUpdates: Failed to fetch update info:', error);
    }
  }

  /**
   * Get update info for a specific pup
   */
  getUpdateInfo(pupId) {
    return store.pupUpdatesContext.updateInfo[pupId] || null;
  }

  /**
   * Check if a specific pup has an update available
   */
  hasUpdate(pupId) {
    const info = this.getUpdateInfo(pupId);
    return info ? info.updateAvailable : false;
  }

  /**
   * Get the latest version available for a pup
   */
  getLatestVersion(pupId) {
    const info = this.getUpdateInfo(pupId);
    return info ? info.latestVersion : null;
  }

  // ========================================================================
  // Ignored Updates Management
  // ========================================================================

  /**
   * Load ignored updates from localStorage
   * @returns {Object} Map of pupId -> [ignoredVersions...]
   */
  _loadIgnored() {
    try {
      const stored = localStorage.getItem(IGNORED_UPDATES_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load ignored updates from localStorage:', error);
    }
    return {};
  }

  /**
   * Save ignored updates to localStorage
   */
  _saveIgnored() {
    try {
      localStorage.setItem(IGNORED_UPDATES_STORAGE_KEY, JSON.stringify(this.ignoredUpdates));
    } catch (error) {
      console.error('Failed to save ignored updates to localStorage:', error);
    }
  }

  /**
   * Ignore a specific version of a pup
   * @param {string} pupId - The pup ID
   * @param {string} version - The version to ignore
   */
  ignoreUpdate(pupId, version) {
    if (!this.ignoredUpdates[pupId]) {
      this.ignoredUpdates[pupId] = [];
    }

    if (!this.ignoredUpdates[pupId].includes(version)) {
      this.ignoredUpdates[pupId].push(version);
      this._saveIgnored();
    }
  }

  /**
   * Check if a specific version is ignored
   * @param {string} pupId - The pup ID
   * @param {string} version - The version to check
   * @returns {boolean} True if the version is ignored
   */
  isUpdateIgnored(pupId, version) {
    return this.ignoredUpdates[pupId]?.includes(version) || false;
  }

  /**
   * Clear all ignored versions for a pup
   * @param {string} pupId - The pup ID
   */
  clearIgnored(pupId) {
    delete this.ignoredUpdates[pupId];
    this._saveIgnored();
  }

  /**
   * Get all ignored versions for a pup
   * @param {string} pupId - The pup ID
   * @returns {Array} Array of ignored versions
   */
  getIgnoredVersions(pupId) {
    return this.ignoredUpdates[pupId] || [];
  }

  /**
   * Get all ignored updates
   * @returns {Object} Map of pupId -> [ignoredVersions...]
   */
  getAllIgnored() {
    return { ...this.ignoredUpdates };
  }

  /**
   * Persist to bootstrap API (optional, for future implementation)
   * This would save ignored updates to the backend for cross-device sync
   */
  async persistToBootstrap() {
    // TODO: Implement bootstrap API persistence
    // For now, this is client-side only
    console.log('Bootstrap persistence not yet implemented');
  }

  /**
   * Load from bootstrap API (optional, for future implementation)
   * This would load ignored updates from the backend
   */
  async loadFromBootstrap() {
    // TODO: Implement bootstrap API loading
    // For now, this is client-side only
    console.log('Bootstrap loading not yet implemented');
  }
}

// Export as singleton
export const pupUpdates = new PupUpdates();

