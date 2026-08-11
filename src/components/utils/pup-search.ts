import type { EnrichedPup } from "/types/pup-model";

export interface PupSearchOptions {
  description?: boolean;
  interfaces?: boolean;
}

export interface ParsedPupSearch {
  searchValue: string;
  searchInInterfaces: boolean;
  searchInDescription: boolean;
}

/**
 * Shared pup search helpers for Explore (store) and Library pages.
 * Keeps URL parsing and searchable-text assembly in one place.
 */

export function isTruthyQueryParam(value: string | null): boolean {
  return value !== null && ["1", "true", "yes"].includes(String(value).toLowerCase());
}

/**
 * Prefill search state from URL query params, e.g.
 *   /explore?search=wallet&interfaces=1&description=1
 *   /pups?q=core&description=true
 */
export function parsePupSearchFromUrl(
  searchParams: URLSearchParams = new URLSearchParams(window.location.search),
): ParsedPupSearch {
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
}: {
  baseParts?: string[];
  descriptionParts?: string[];
  interfaceNames?: string[];
  options?: PupSearchOptions;
} = {}): string {
  const parts = [...baseParts];

  if (options.description) {
    parts.push(...descriptionParts);
  }

  if (options.interfaces) {
    parts.push(...interfaceNames);
  }

  return parts.join(" ").toLowerCase();
}

/** Read optional legacy string fields (e.g. descShort) without type assertions. */
function legacyString(obj: object | null | undefined, key: string): string {
  if (!obj) return "";
  const value = Reflect.get(obj, key);
  return typeof value === "string" ? value : "";
}

function descriptionPartsFromMeta(meta: object | null | undefined): string[] {
  return [
    legacyString(meta, "shortDescription") || legacyString(meta, "descShort"),
    legacyString(meta, "longDescription") || legacyString(meta, "descLong"),
  ];
}

function interfaceNamesFromList(
  interfaces: ReadonlyArray<{ name?: string } | null | undefined> = [],
): string[] {
  return interfaces.map((iface) => iface?.name || "");
}

/** Catalog / store listing package shape (Explore). */
export function getStoreSearchableText(
  pkg: EnrichedPup,
  options: PupSearchOptions = {},
): string {
  const def = pkg?.def;
  const latestVersion = def?.latestVersion ?? "";
  const version = def?.versions?.[latestVersion];
  const meta = version?.meta;

  return buildSearchableText({
    baseParts: [def?.key || "", meta?.name || ""],
    descriptionParts: descriptionPartsFromMeta(meta),
    // Only interfaces this pup provides (not ones it depends on).
    interfaceNames: interfaceNamesFromList(version?.interfaces ?? []),
    options,
  });
}

/** Installed package shape (Library). */
export function getLibrarySearchableText(
  pkg: EnrichedPup,
  options: PupSearchOptions = {},
): string {
  const manifest = pkg?.state?.manifest;
  const meta = manifest?.meta;

  return buildSearchableText({
    baseParts: [meta?.name || "", pkg?.state?.id || ""],
    descriptionParts: descriptionPartsFromMeta(meta),
    interfaceNames: interfaceNamesFromList(manifest?.interfaces ?? []),
    options,
  });
}
