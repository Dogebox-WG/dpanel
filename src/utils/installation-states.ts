/**
 * Utility functions for handling installation states across the application
 */

/** Visual properties (badge class, icon, Shoelace variant) for a state. */
export interface InstallationStateProperties {
  class: string;
  icon: string;
  variant: "success" | "warning" | "danger" | "neutral";
}

/**
 * Get the visual properties for an installation state
 * @param stateId - The installation state ID (e.g. 'READY', 'INSTALLING')
 * @returns Object containing class, icon, and variant properties
 */
export function getInstallationStateProperties(
  stateId: string | null | undefined,
): InstallationStateProperties {

  if (!stateId) {
    return {
      class: "unknown",
      icon: "question-circle-fill",
      variant: "neutral",
    };
  }

  const state = stateId.toUpperCase();
  switch (state) {
    case "READY":
      return {
        class: "ready",
        icon: "check-circle-fill",
        variant: "success",
      };
    case "INSTALLING":
      return {
        class: "installing",
        icon: "arrow-repeat",
        variant: "warning",
      };
    case "UNINSTALLING":
      return {
        class: "uninstalling",
        icon: "arrow-repeat",
        variant: "warning",
      };
    case "PURGING":
      return {
        class: "purging",
        icon: "arrow-repeat",
        variant: "warning",
      };
    case "BROKEN":
      return {
        class: "broken",
        icon: "exclamation-triangle-fill",
        variant: "danger",
      };
    case "UNINSTALLED":
      return {
        class: "uninstalled",
        icon: "dash-circle-fill",
        variant: "neutral",
      };
    default:
      console.log("No matching state found, returning unknown state");
      return {
        class: "unknown",
        icon: "question-circle-fill",
        variant: "neutral",
      };
  }
}

/**
 * Check if a state represents a loading state
 * @param stateId - The installation state ID
 * @returns Whether the state is a loading state
 */
export function isInstallationLoadingState(stateId: string | null | undefined): boolean {
  if (!stateId) {
    return false;
  }
  const state = stateId.toUpperCase();
  const isLoading = ["INSTALLING", "UNINSTALLING", "PURGING"].includes(state);
  return isLoading;
}
