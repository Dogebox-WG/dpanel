/**
 * Shared pup search helpers for Explore (store) and Library pages.
 * Keeps URL parsing and searchable-text assembly in one place.
 */

export function isTruthyQueryParam(value) {
  return value !== null && ["1", "true", "yes"].includes(String(value).toLowerCase());
}

/**
 * Prefill search state from URL query params, e.g.
 *   /explore?search=wallet&interfaces=1&description=1
 *   /pups?q=core&description=true
 */
export function parsePupSearchFromUrl(
  searchParams = new URLSearchParams(window.location.search),
) {
  const search = searchParams.get("search") ?? searchParams.get("q");

  return {
    searchValue: search !== null ? search : "",
    searchInInterfaces: searchParams.has("interfaces")
      ? isTruthyQueryParam(searchParams.get("interfaces"))
      : false,
    searchInDescription: searchParams.has("description")
      ? isTruthyQueryParam(searchParams.get("description"))
      : false,
  };
}

export function buildSearchableText({
  baseParts = [],
  descriptionParts = [],
  interfaceNames = [],
  options = {},
} = {}) {
  const parts = [...baseParts];

  if (options.description) {
    parts.push(...descriptionParts);
  }

  if (options.interfaces) {
    parts.push(...interfaceNames);
  }

  return parts.join(" ").toLowerCase();
}

function descriptionPartsFromMeta(meta = {}) {
  return [
    meta.shortDescription || meta.descShort || "",
    meta.longDescription || meta.descLong || "",
  ];
}

function interfaceNamesFromList(interfaces = []) {
  return interfaces.map((iface) => iface?.name || "");
}

/** Catalog / store listing package shape (Explore). */
export function getStoreSearchableText(pkg, options = {}) {
  const def = pkg?.def;
  const version = def?.versions?.[def?.latestVersion] || {};
  const meta = version.meta || {};

  return buildSearchableText({
    baseParts: [def?.key || "", meta.name || ""],
    descriptionParts: descriptionPartsFromMeta(meta),
    // Only interfaces this pup provides (not ones it depends on).
    interfaceNames: interfaceNamesFromList(version.interfaces),
    options,
  });
}

/** Installed package shape (Library). */
export function getLibrarySearchableText(pkg, options = {}) {
  const manifest = pkg?.state?.manifest || {};
  const meta = manifest.meta || {};

  return buildSearchableText({
    baseParts: [meta.name || "", pkg?.state?.id || ""],
    descriptionParts: descriptionPartsFromMeta(meta),
    interfaceNames: interfaceNamesFromList(manifest.interfaces),
    options,
  });
}
