/**
 * Semantic version comparison utilities
 * Uses the browser's built-in localeCompare with numeric option for version comparison
 */

/**
 * Compare two semantic version strings using localeCompare with numeric sorting
 * @param a - First version (e.g., "1.2.3" or "v1.2.3")
 * @param b - Second version (e.g., "1.2.3" or "v1.2.3")
 * @returns -1 if a < b, 0 if a == b, 1 if a > b
 */
export function compareVersions(a: string | null | undefined, b: string | null | undefined) {
  if (!a || !b) return 0;

  // Remove 'v' prefix if present for consistent comparison
  const cleanA = a.replace(/^v/, "");
  const cleanB = b.replace(/^v/, "");

  // Use localeCompare with numeric option for natural version sorting
  // This properly handles multi-digit version parts (e.g., "1.10.0" > "1.9.0")
  return cleanA.localeCompare(cleanB, undefined, { numeric: true });
}

/**
 * Sort an array of version strings in descending order (latest first)
 * @param versions - Array of version strings
 * @returns Sorted array (descending)
 */
export function sortVersionsDescending(versions: string[]) {
  return [...versions].sort((a, b) => compareVersions(b, a));
}

/**
 * Sort an array of version strings in ascending order (oldest first)
 * @param versions - Array of version strings
 * @returns Sorted array (ascending)
 */
export function sortVersionsAscending(versions: string[]) {
  return [...versions].sort((a, b) => compareVersions(a, b));
}

/**
 * Sort an array of objects with version properties in descending order
 * @param items - Array of objects with a version property
 * @param versionKey - The key name for the version property (default: 'version')
 * @returns Sorted array (descending)
 */
export function sortByVersionDescending<T extends Record<string, unknown>>(
  items: T[],
  versionKey = "version",
) {
  return [...items].sort((a, b) => {
    const av = a[versionKey];
    const bv = b[versionKey];
    return compareVersions(
      typeof bv === "string" ? bv : undefined,
      typeof av === "string" ? av : undefined,
    );
  });
}

/**
 * Sort an array of objects with version properties in ascending order
 * @param items - Array of objects with a version property
 * @param versionKey - The key name for the version property (default: 'version')
 * @returns Sorted array (ascending)
 */
export function sortByVersionAscending<T extends Record<string, unknown>>(
  items: T[],
  versionKey = "version",
) {
  return [...items].sort((a, b) => {
    const av = a[versionKey];
    const bv = b[versionKey];
    return compareVersions(
      typeof av === "string" ? av : undefined,
      typeof bv === "string" ? bv : undefined,
    );
  });
}
