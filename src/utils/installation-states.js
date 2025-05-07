/**
 * Utility functions for handling installation states across the application
 */

/**
 * Get the visual properties for an installation state
 * @param {string} stateId - The installation state ID (e.g. 'READY', 'INSTALLING')
 * @returns {Object} Object containing class, icon, and variant properties
 */
export function getInstallationStateProperties(stateId) {
    
  if (!stateId) {
    console.log('No stateId provided, returning unknown state');
    return {
      class: "unknown",
      icon: "question-circle-fill",
      variant: "neutral"
    };
  }

  const state = stateId.toUpperCase();
  console.log('state', state);
  switch(state) {
    case 'READY':
      return {
        class: "ready",
        icon: "check-circle-fill",
        variant: "success"
      };
    case 'INSTALLING':
      return {
        class: "installing",
        icon: "arrow-repeat",
        variant: "warning"
      };
    case 'UNINSTALLING':
      return {
        class: "uninstalling",
        icon: "arrow-repeat",
        variant: "warning"
      };
    case 'PURGING':
      return {
        class: "purging",
        icon: "arrow-repeat",
        variant: "warning"
      };
    case 'BROKEN':
      return {
        class: "broken",
        icon: "exclamation-triangle-fill",
        variant: "danger"
      };
    case 'UNINSTALLED':
      return {
        class: "uninstalled",
        icon: "dash-circle-fill",
        variant: "neutral"
      };
    default:
      console.log('No matching state found, returning unknown state');
      return {
        class: "unknown",
        icon: "question-circle-fill",
        variant: "neutral"
      };
  }
}

/**
 * Check if a state represents a loading state
 * @param {string} stateId - The installation state ID
 * @returns {boolean} Whether the state is a loading state
 */
export function isInstallationLoadingState(stateId) {
  if (!stateId) {
    console.log('No stateId provided, returning false');
    return false;
  }
  const state = stateId.toUpperCase();
  const isLoading = ["INSTALLING", "UNINSTALLING", "PURGING"].includes(state);
  return isLoading;
} 