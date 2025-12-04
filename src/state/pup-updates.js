import { getAllPupUpdates } from '/api/pup-updates/pup-updates.js';
import { store } from '/state/store.js';

const SKIPPED_UPDATES_STORAGE_KEY = 'dpanel:skippedUpdates';
const CACHED_UPDATES_STORAGE_KEY = 'dpanel:cachedPupUpdates';

/**
 * Pup update state management.
 * The backend (dogeboxd) handles periodic update checking and caching.
 * This module fetches cached data from the backend and updates the frontend store,
 * and manages locally skipped updates.
 */
class PupUpdates {
  constructor() {
    // skippedUpdates format: { pupId: { skippedAtVersion: "1.0.0", latestVersionAtSkip: "1.2.0" } }
    this.skippedUpdates = this._loadSkipped();
  }

  /**
   * Initialize - loads cached data immediately from localStorage only
   * Does NOT trigger a backend refresh (backend handles periodic checks automatically)
   */
  async init() {
    console.log('PupUpdates: Initializing...');
    
    // Load cached update info from localStorage for immediate display
    // Backend will handle periodic checks and send websocket events when updates are found
    this._loadCachedUpdates();
  }

  /**
   * Load cached update info from localStorage for immediate display on page load
   */
  _loadCachedUpdates() {
    try {
      const stored = localStorage.getItem(CACHED_UPDATES_STORAGE_KEY);
      if (stored) {
        const cached = JSON.parse(stored);
        console.log('[PupUpdates State] Loading cached updates from localStorage:', cached);
        
        // Calculate total updates available (excluding skipped)
        let totalUpdatesAvailable = 0;
        const updateInfo = cached.updateInfo || {};
        for (const pupId in updateInfo) {
          if (updateInfo[pupId].updateAvailable && !this.isUpdateSkipped(pupId, updateInfo[pupId].latestVersion)) {
            totalUpdatesAvailable++;
          }
        }
        
        // Update store with cached data immediately
        store.updateState({
          pupUpdatesContext: {
            updateInfo,
            lastChecked: cached.lastChecked,
            totalUpdatesAvailable,
            isChecking: false,
            error: null
          }
        });
      }
    } catch (error) {
      console.error('[PupUpdates State] Failed to load cached updates from localStorage:', error);
    }
  }

  /**
   * Save update info to localStorage for fast loading on page refresh
   */
  _saveCachedUpdates(updateInfo, lastChecked) {
    try {
      localStorage.setItem(CACHED_UPDATES_STORAGE_KEY, JSON.stringify({
        updateInfo,
        lastChecked
      }));
    } catch (error) {
      console.error('[PupUpdates State] Failed to save cached updates to localStorage:', error);
    }
  }

  /**
   * Clear cached updates from localStorage
   */
  clearCachedUpdates() {
    localStorage.removeItem(CACHED_UPDATES_STORAGE_KEY);
    console.log('[PupUpdates State] Cleared cached updates from localStorage');
  }

  /**
   * Fetch cached update info from backend and update the store.
   * Note: The backend handles periodic checking automatically.
   * This just fetches the current cached state.
   */
  async refresh() {
    console.log('[PupUpdates State] refresh() called');
    console.log('[PupUpdates State] Current store.networkContext.useMocks:', store.networkContext?.useMocks);
    
    // Set loading state
    store.updateState({
      pupUpdatesContext: {
        ...store.pupUpdatesContext,
        isChecking: true
      }
    });

    try {
      console.log('[PupUpdates State] Fetching cached update info from backend/mock...');
      const updateInfo = await getAllPupUpdates();
      console.log('[PupUpdates State] Got updateInfo:', updateInfo);
      console.log('[PupUpdates State] updateInfo keys:', Object.keys(updateInfo || {}));
      
      // Count total updates available (excluding skipped ones)
      let totalUpdatesAvailable = 0;
      for (const pupId in updateInfo) {
        const isSkipped = this.isUpdateSkipped(pupId, updateInfo[pupId].latestVersion);
        console.log(`[PupUpdates State] Pup ${pupId}: updateAvailable=${updateInfo[pupId].updateAvailable}, isSkipped=${isSkipped}`);
        if (updateInfo[pupId].updateAvailable && !isSkipped) {
          totalUpdatesAvailable++;
        }
      }
      
      console.log(`[PupUpdates State] Total updates available: ${totalUpdatesAvailable}`);
      
      // Update the store
      const lastChecked = new Date().toISOString();
      const newContext = {
        updateInfo,
        lastChecked,
        totalUpdatesAvailable,
        isChecking: false,
        error: null
      };
      console.log('[PupUpdates State] Updating store with:', newContext);
      
      store.updateState({
        pupUpdatesContext: newContext
      });
      
      // Cache to localStorage for fast loading on page refresh
      this._saveCachedUpdates(updateInfo, lastChecked);
      
      console.log('[PupUpdates State] Store updated. Current pupUpdatesContext:', store.pupUpdatesContext);
    } catch (error) {
      console.error('[PupUpdates State] Failed to fetch update info:', error);
      store.updateState({
        pupUpdatesContext: {
          ...store.pupUpdatesContext,
          isChecking: false,
          error: error.message || 'Failed to check for updates'
        }
      });
    }
  }

  /**
   * Get update info for a specific pup
   */
  getUpdateInfo(pupId) {
    const info = store.pupUpdatesContext.updateInfo[pupId] || null;
    console.log(`[PupUpdates State] getUpdateInfo(${pupId}):`, info);
    return info;
  }

  /**
   * Check if a specific pup has an update available (respecting skipped updates)
   * @param {string} pupId - The pup ID
   * @returns {boolean} True if update is available and not skipped
   */
  hasUpdate(pupId) {
    console.log(`[PupUpdates State] hasUpdate(${pupId}) called`);
    console.log(`[PupUpdates State] Current pupUpdatesContext:`, store.pupUpdatesContext);
    
    const info = this.getUpdateInfo(pupId);
    if (!info || !info.updateAvailable) {
      console.log(`[PupUpdates State] hasUpdate(${pupId}) = false (no info or not available)`);
      return false;
    }
    // Check if this update is skipped
    const isSkipped = this.isUpdateSkipped(pupId, info.latestVersion);
    const result = !isSkipped;
    console.log(`[PupUpdates State] hasUpdate(${pupId}) = ${result} (isSkipped=${isSkipped})`);
    return result;
  }

  /**
   * Get the latest version available for a pup
   */
  getLatestVersion(pupId) {
    const info = this.getUpdateInfo(pupId);
    return info ? info.latestVersion : null;
  }

  // ========================================================================
  // Skipped Updates Management (new pattern: skip all versions up to latest)
  // ========================================================================

  /**
   * Load skipped updates from localStorage
   * @returns {Object} Map of pupId -> { skippedAtVersion, latestVersionAtSkip }
   */
  _loadSkipped() {
    try {
      const stored = localStorage.getItem(SKIPPED_UPDATES_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load skipped updates from localStorage:', error);
    }
    return {};
  }

  /**
   * Save skipped updates to localStorage
   */
  _saveSkipped() {
    try {
      localStorage.setItem(SKIPPED_UPDATES_STORAGE_KEY, JSON.stringify(this.skippedUpdates));
    } catch (error) {
      console.error('Failed to save skipped updates to localStorage:', error);
    }
  }

  /**
   * Skip all available updates for a pup (up to current latest)
   * The skip will be lifted when a version newer than latestVersionAtSkip is released
   * @param {string} pupId - The pup ID
   */
  skipUpdate(pupId) {
    const info = this.getUpdateInfo(pupId);
    if (!info || !info.updateAvailable) {
      return;
    }

    this.skippedUpdates[pupId] = {
      skippedAtVersion: info.currentVersion,
      latestVersionAtSkip: info.latestVersion,
      skippedAt: new Date().toISOString()
    };
    this._saveSkipped();
    
    // Re-calculate totalUpdatesAvailable after skipping
    this._updateTotalCount();
    
    console.log(`PupUpdates: Skipped updates for ${pupId} up to version ${info.latestVersion}`);
  }

  /**
   * Check if updates are currently skipped for a pup
   * @param {string} pupId - The pup ID
   * @param {string} latestVersion - The current latest version available
   * @returns {boolean} True if updates are skipped and latestVersion <= latestVersionAtSkip
   */
  isUpdateSkipped(pupId, latestVersion) {
    const skipInfo = this.skippedUpdates[pupId];
    if (!skipInfo) {
      return false;
    }

    // Compare versions: if latestVersion > latestVersionAtSkip, the skip is no longer valid
    // Simple string comparison works for semver in most cases for this purpose
    // But we need proper comparison
    return this._compareVersions(latestVersion, skipInfo.latestVersionAtSkip) <= 0;
  }

  /**
   * Compare two semver strings
   * @returns {number} -1 if a < b, 0 if a == b, 1 if a > b
   */
  _compareVersions(a, b) {
    if (!a || !b) return 0;
    
    const partsA = a.replace(/^v/, '').split('.').map(n => parseInt(n, 10) || 0);
    const partsB = b.replace(/^v/, '').split('.').map(n => parseInt(n, 10) || 0);
    
    for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
      const partA = partsA[i] || 0;
      const partB = partsB[i] || 0;
      if (partA < partB) return -1;
      if (partA > partB) return 1;
    }
    return 0;
  }

  /**
   * Clear skipped status for a pup
   * @param {string} pupId - The pup ID
   */
  clearSkipped(pupId) {
    delete this.skippedUpdates[pupId];
    this._saveSkipped();
    
    // Re-calculate totalUpdatesAvailable after clearing skip
    this._updateTotalCount();
  }

  /**
   * Get skip info for a pup
   * @param {string} pupId - The pup ID
   * @returns {Object|null} Skip info or null if not skipped
   */
  getSkipInfo(pupId) {
    return this.skippedUpdates[pupId] || null;
  }

  /**
   * Get all skipped updates
   * @returns {Object} Map of pupId -> skip info
   */
  getAllSkipped() {
    return { ...this.skippedUpdates };
  }

  /**
   * Update the total updates count in the store
   * (called after skip/unskip operations)
   */
  _updateTotalCount() {
    const updateInfo = store.pupUpdatesContext.updateInfo || {};
    let totalUpdatesAvailable = 0;
    
    for (const pupId in updateInfo) {
      if (updateInfo[pupId].updateAvailable && !this.isUpdateSkipped(pupId, updateInfo[pupId].latestVersion)) {
        totalUpdatesAvailable++;
      }
    }
    
    store.updateState({
      pupUpdatesContext: {
        ...store.pupUpdatesContext,
        totalUpdatesAvailable
      }
    });
  }

  // ========================================================================
  // Legacy compatibility (redirects to new skip pattern)
  // ========================================================================

  /**
   * @deprecated Use skipUpdate instead
   */
  ignoreUpdate(pupId, version) {
    console.warn('ignoreUpdate is deprecated, use skipUpdate instead');
    this.skipUpdate(pupId);
  }

  /**
   * @deprecated Use isUpdateSkipped instead
   */
  isUpdateIgnored(pupId, version) {
    const info = this.getUpdateInfo(pupId);
    return this.isUpdateSkipped(pupId, info?.latestVersion || version);
  }

  /**
   * @deprecated Use clearSkipped instead
   */
  clearIgnored(pupId) {
    this.clearSkipped(pupId);
  }
}

// Export as singleton
export const pupUpdates = new PupUpdates();
