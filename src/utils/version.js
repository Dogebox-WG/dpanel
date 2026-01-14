/**
 * Semantic version comparison utilities
 * Uses the browser's built-in localeCompare with numeric option for version comparison
 */

/**
 * Compare two semantic version strings using localeCompare with numeric sorting
 * @param {string} a - First version (e.g., "1.2.3" or "v1.2.3")
 * @param {string} b - Second version (e.g., "1.2.3" or "v1.2.3")
 * @returns {number} -1 if a < b, 0 if a == b, 1 if a > b
 */
export function compareVersions(a, b) {
  if (!a || !b) return 0;
  
  // Remove 'v' prefix if present for consistent comparison
  const cleanA = a.replace(/^v/, '');
  const cleanB = b.replace(/^v/, '');
  
  // Use localeCompare with numeric option for natural version sorting
  // This properly handles multi-digit version parts (e.g., "1.10.0" > "1.9.0")
  return cleanA.localeCompare(cleanB, undefined, { numeric: true });
}

/**
 * Sort an array of version strings in descending order (latest first)
 * @param {string[]} versions - Array of version strings
 * @returns {string[]} Sorted array (descending)
 */
export function sortVersionsDescending(versions) {
  return [...versions].sort((a, b) => compareVersions(b, a));
}

/**
 * Sort an array of version strings in ascending order (oldest first)
 * @param {string[]} versions - Array of version strings
 * @returns {string[]} Sorted array (ascending)
 */
export function sortVersionsAscending(versions) {
  return [...versions].sort((a, b) => compareVersions(a, b));
}

/**
 * Sort an array of objects with version properties in descending order
 * @param {Array} items - Array of objects with a version property
 * @param {string} versionKey - The key name for the version property (default: 'version')
 * @returns {Array} Sorted array (descending)
 */
export function sortByVersionDescending(items, versionKey = 'version') {
  return [...items].sort((a, b) => compareVersions(b[versionKey], a[versionKey]));
}

/**
 * Sort an array of objects with version properties in ascending order
 * @param {Array} items - Array of objects with a version property
 * @param {string} versionKey - The key name for the version property (default: 'version')
 * @returns {Array} Sorted array (ascending)
 */
export function sortByVersionAscending(items, versionKey = 'version') {
  return [...items].sort((a, b) => compareVersions(a[versionKey], b[versionKey]));
}

