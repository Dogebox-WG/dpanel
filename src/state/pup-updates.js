import { getAllPupUpdates, getSkippedUpdates, skipPupUpdate as apiSkipPupUpdate, clearSkippedUpdate as apiClearSkippedUpdate } from '/api/pup-updates/pup-updates.js';
import { store } from '/state/store.js';
import { pkgController } from '/controllers/package/index.js';
import { compareVersions } from '/utils/version.js';

const SKIPPED_UPDATES_STORAGE_KEY = 'dpanel:skippedUpdates';
const CACHED_UPDATES_STORAGE_KEY = 'dpanel:cachedPupUpdates';
const CACHE_VERSION = 1; // Increment this to invalidate old caches

/**
 * Pup update state management.
 * The backend (dogeboxd) handles periodic update checking and caching.
 * This module fetches cached data from the backend and updates the frontend store.
 * Skipped updates are persisted to the backend, with localStorage as a cache.
 */
class PupUpdates {
  constructor() {
    // skippedUpdates format: { "dogenet": "1.2.0", "core": "2.0.1" } - maps pupId to skipped version
    this.skippedUpdates = this._loadSkippedFromLocalStorage();
  }

  /**
   * Initialize - loads cached data immediately from localStorage and backend
   * Does NOT trigger a backend refresh (backend handles periodic checks automatically)
   */
  async init() {
    this._loadCachedUpdates();
    await this._loadSkippedFromBackend();
    
    // Clean up stale entries after initial load
    this._reconcileCache();
  }

  /**
   * Reconcile the update cache with actually installed pups
   * Removes entries for pups that are no longer installed
   */
  _reconcileCache() {
    let updateInfo = store.pupUpdatesContext.updateInfo || {};
    // Ensure updateInfo is actually an object, not a string or other type
    if (typeof updateInfo !== 'object' || updateInfo === null || Array.isArray(updateInfo)) {
      console.warn('[PupUpdates] Invalid updateInfo type, resetting to empty object:', typeof updateInfo);
      updateInfo = {};
    }
    const installedPupIds = pkgController.stateIndex || {};
    
    // If no pups are loaded yet, skip reconciliation
    if (Object.keys(installedPupIds).length === 0 && Object.keys(updateInfo).length === 0) {
      return;
    }
    
    let cleaned = false;
    const staleEntries = [];
    
    // Check each cached update entry
    for (const pupId in updateInfo) {
      // If this pup is not in the installed pups list, it's stale
      if (!installedPupIds[pupId]) {
        staleEntries.push(pupId);
        delete updateInfo[pupId];
        cleaned = true;
      }
    }
    
    if (cleaned) {
      // Also clean up skipped updates for uninstalled pups
      for (const pupId of staleEntries) {
        delete this.skippedUpdates[pupId];
      }
      this._saveSkippedToLocalStorage();
      
      // Recalculate total count
      let totalUpdatesAvailable = 0;
      for (const pupId in updateInfo) {
        if (this.hasUpdate(pupId)) {
          totalUpdatesAvailable++;
        }
      }
      
      // Update store
      store.updateState({
        pupUpdatesContext: {
          ...store.pupUpdatesContext,
          updateInfo,
          totalUpdatesAvailable
        }
      });
      
      // Update localStorage cache
      this._saveCachedUpdates(updateInfo, store.pupUpdatesContext.lastChecked);
    }
  }

  /**
   * Manually trigger cache reconciliation
   * Useful for debugging or recovering from sync issues
   */
  reconcile() {
    this._reconcileCache();
  }

  /**
   * Load cached update info from localStorage for immediate display on page load
   */
  _loadCachedUpdates() {
    try {
      const stored = localStorage.getItem(CACHED_UPDATES_STORAGE_KEY);
      if (stored) {
        const cached = JSON.parse(stored);
        
        // Check cache version - invalidate if mismatch
        if (cached.version !== CACHE_VERSION) {
          console.log(`[PupUpdates] Cache version mismatch (${cached.version} vs ${CACHE_VERSION}), clearing cache`);
          this.clearCachedUpdates();
          return;
        }
        
        // Validate and sanitize updateInfo - ensure it's actually an object
        let updateInfo = cached.updateInfo;
        if (typeof updateInfo !== 'object' || updateInfo === null || Array.isArray(updateInfo)) {
          console.warn('[PupUpdates] Invalid cached updateInfo type, clearing cache:', typeof updateInfo);
          // Clear the corrupted cache
          this.clearCachedUpdates();
          return;
        }
        
        // Calculate total updates available (excluding skipped and upgrading/broken)
        let totalUpdatesAvailable = 0;
        for (const pupId in updateInfo) {
          if (this.hasUpdate(pupId)) {
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
      // Clear potentially corrupted cache
      this.clearCachedUpdates();
    }
  }

  /**
   * Save update info to localStorage for fast loading on page refresh
   */
  _saveCachedUpdates(updateInfo, lastChecked) {
    try {
      localStorage.setItem(CACHED_UPDATES_STORAGE_KEY, JSON.stringify({
        version: CACHE_VERSION,
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
  }

  /**
   * Fetch cached update info from backend and update the store.
   * Note: The backend handles periodic checking automatically.
   * This just fetches the current cached state.
   */
  async refresh() {
    // Set loading state
    store.updateState({
      pupUpdatesContext: {
        ...store.pupUpdatesContext,
        isChecking: true
      }
    });

    try {
      const updateInfo = await getAllPupUpdates();
      // Validate the response is an object
      if (typeof updateInfo !== 'object' || updateInfo === null || Array.isArray(updateInfo)) {
        throw new Error(`Invalid update info response from backend: expected object, got ${typeof updateInfo}`);
      }
      
      // Count total updates available (excluding skipped and upgrading/broken)
      let totalUpdatesAvailable = 0;
      for (const pupId in updateInfo) {
        // Pass updateInfo to hasUpdate so it checks against new data, not stale store data
        const hasUpdate = this.hasUpdate(pupId, false, updateInfo);
        console.log(`[PupUpdates] hasUpdate(${pupId}): ${hasUpdate}, info:`, updateInfo[pupId]);
        if (hasUpdate) {
          totalUpdatesAvailable++;
        }
      }
      
      // Update the store
      const lastChecked = new Date().toISOString();
      const newContext = {
        updateInfo,
        lastChecked,
        totalUpdatesAvailable,
        isChecking: false,
        error: null
      };
      
      store.updateState({
        pupUpdatesContext: newContext
      });
      
      // Cache to localStorage for fast loading on page refresh
      this._saveCachedUpdates(updateInfo, lastChecked);
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
    const updateInfo = store.pupUpdatesContext.updateInfo;
    if (typeof updateInfo !== 'object' || updateInfo === null || Array.isArray(updateInfo)) {
      return null;
    }
    const info = updateInfo[pupId] || null;
    return info;
  }

  /**
   * Get update info from a provided updateInfo object (doesn't read from store)
   * Used during refresh() before the store is updated
   */
  _getUpdateInfoFromData(updateInfo, pupId) {
    if (typeof updateInfo !== 'object' || updateInfo === null || Array.isArray(updateInfo)) {
      return null;
    }
    return updateInfo[pupId] || null;
  }

  /**
   * Check if a specific pup has an update available (respecting skipped updates)
   * @param {string} pupId - The pup ID
   * @param {boolean} debug - Enable debug logging
   * @param {Object} updateInfoData - Optional: Check against this data instead of store
   * @returns {boolean} True if update is available and not skipped
   */
  hasUpdate(pupId, debug = false, updateInfoData = null) {
    // Get info from provided data or from store
    const info = updateInfoData 
      ? this._getUpdateInfoFromData(updateInfoData, pupId)
      : this.getUpdateInfo(pupId);
    
    if (!info || !info.updateAvailable) {
      return false;
    }
    
    // Check if this update is skipped
    if (this.isUpdateSkipped(pupId, info.latestVersion)) {
      return false;
    }
    
    // Hide updates if an upgrade is in progress or has failed
    const pupState = pkgController.stateIndex[pupId];
    if (pupState) {
      const installation = pupState.installation;
      // Don't show update badge if upgrading or broken (failed upgrade)
      if (installation === 'upgrading' || installation === 'broken') {
        return false;
      }
    }
    
    return true;
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
   * Load skipped updates from localStorage (for immediate display on page load)
   * @returns {Object} Map of pupId -> skippedVersion (string)
   */
  _loadSkippedFromLocalStorage() {
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
   * Load skipped updates from backend (authoritative source)
   * Updates localStorage cache after loading
   */
  async _loadSkippedFromBackend() {
    try {
      const skipped = await getSkippedUpdates();
      
      // Validate the response is an object
      if (typeof skipped !== 'object' || skipped === null || Array.isArray(skipped)) {
        console.error('[PupUpdates State] Invalid skipped updates response from backend:', typeof skipped);
        return;
      }
      
      // Update in-memory state
      this.skippedUpdates = skipped;
      
      // Update localStorage cache
      this._saveSkippedToLocalStorage();
      
      // Recalculate total count
      this._updateTotalCount();
    } catch (error) {
      console.error('[PupUpdates State] Failed to load skipped updates from backend:', error);
      // Keep using localStorage cache on error
    }
  }

  /**
   * Save skipped updates to localStorage (as cache)
   */
  _saveSkippedToLocalStorage() {
    try {
      localStorage.setItem(SKIPPED_UPDATES_STORAGE_KEY, JSON.stringify(this.skippedUpdates));
    } catch (error) {
      console.error('Failed to save skipped updates to localStorage:', error);
    }
  }

  /**
   * Skip all available updates for a pup (up to current latest)
   * The skip will be lifted when a version newer than the skipped version is released
   * Now persists to backend instead of just localStorage
   * @param {string} pupId - The pup ID
   */
  async skipUpdate(pupId) {
    const info = this.getUpdateInfo(pupId);
    if (!info || !info.updateAvailable) {
      return;
    }

    try {
      // Call backend API to persist the skip
      await apiSkipPupUpdate(pupId);
      
      // Update local state - just store the skipped version
      this.skippedUpdates[pupId] = info.latestVersion;
      
      // Update localStorage cache
      this._saveSkippedToLocalStorage();
      
      // Re-calculate totalUpdatesAvailable after skipping
      this._updateTotalCount();
    } catch (error) {
      console.error(`PupUpdates: Failed to skip update for ${pupId}:`, error);
      throw error;
    }
  }

  /**
   * Check if updates are currently skipped for a pup
   * @param {string} pupId - The pup ID
   * @param {string} latestVersion - The current latest version available
   * @returns {boolean} True if updates are skipped and latestVersion <= skippedVersion
   */
  isUpdateSkipped(pupId, latestVersion) {
    const skippedVersion = this.skippedUpdates[pupId];
    if (!skippedVersion) {
      return false;
    }

    // Compare versions: if latestVersion > skippedVersion, the skip is no longer valid
    return this._compareVersions(latestVersion, skippedVersion) <= 0;
  }

  /**
   * Compare two semver strings
   * @returns {number} -1 if a < b, 0 if a == b, 1 if a > b
   * @deprecated Use compareVersions from /utils/version.js instead
   */
  _compareVersions(a, b) {
    return compareVersions(a, b);
  }

  /**
   * Clear skipped status for a pup
   * Now persists to backend instead of just localStorage
   * @param {string} pupId - The pup ID
   */
  async clearSkipped(pupId) {
    try {
      // Call backend API to clear the skip
      await apiClearSkippedUpdate(pupId);
      
      // Update local state
      delete this.skippedUpdates[pupId];
      
      // Update localStorage cache
      this._saveSkippedToLocalStorage();
      
      // Re-calculate totalUpdatesAvailable after clearing skip
      this._updateTotalCount();
    } catch (error) {
      console.error(`PupUpdates: Failed to clear skip for ${pupId}:`, error);
      throw error;
    }
  }

  /**
   * Clear update info for a pup (called when pup is uninstalled)
   * @param {string} pupId - The pup ID
   */
  clearUpdateInfo(pupId) {
    let updateInfo = store.pupUpdatesContext.updateInfo || {};
    // Ensure updateInfo is actually an object, not a string or other type
    if (typeof updateInfo !== 'object' || updateInfo === null || Array.isArray(updateInfo)) {
      console.warn('[PupUpdates] Invalid updateInfo type in clearUpdateInfo, resetting to empty object:', typeof updateInfo);
      updateInfo = {};
    }
    
    // Remove the pup from update info
    delete updateInfo[pupId];
    
    // Also clear any skipped status
    delete this.skippedUpdates[pupId];
    
    // Recalculate total count
    let totalUpdatesAvailable = 0;
    for (const pid in updateInfo) {
      if (this.hasUpdate(pid)) {
        totalUpdatesAvailable++;
      }
    }
    
    // Update store
    store.updateState({
      pupUpdatesContext: {
        ...store.pupUpdatesContext,
        updateInfo,
        totalUpdatesAvailable
      }
    });
    
    // Update localStorage caches
    this._saveCachedUpdates(updateInfo, store.pupUpdatesContext.lastChecked);
    this._saveSkippedToLocalStorage();
  }

  /**
   * Get skip info for a pup
   * @param {string} pupId - The pup ID
   * @returns {string|null} Skipped version or null if not skipped
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
    let updateInfo = store.pupUpdatesContext.updateInfo || {};
    // Ensure updateInfo is actually an object, not a string or other type
    if (typeof updateInfo !== 'object' || updateInfo === null || Array.isArray(updateInfo)) {
      console.warn('[PupUpdates] Invalid updateInfo type in _updateTotalCount, using empty object:', typeof updateInfo);
      updateInfo = {};
    }
    let totalUpdatesAvailable = 0;
    
    for (const pupId in updateInfo) {
      if (this.hasUpdate(pupId)) {
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

// Expose debug utilities to window
if (typeof window !== 'undefined') {
  window.pupUpdates = {
    reconcile: () => {
      console.log('[Debug] Manually triggering cache reconciliation');
      pupUpdates.reconcile();
    },
    clearAll: () => {
      console.log('[Debug] Clearing all update cache and skipped updates');
      pupUpdates.skippedUpdates = {};
      pupUpdates._saveSkippedToLocalStorage();
      store.updateState({
        pupUpdatesContext: {
          updateInfo: {},
          lastChecked: null,
          totalUpdatesAvailable: 0,
          isChecking: false,
          error: null
        }
      });
      pupUpdates._saveCachedUpdates({}, null);
      console.log('[Debug] All caches cleared');
    }
  };
}
