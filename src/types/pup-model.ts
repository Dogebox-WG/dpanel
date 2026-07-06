import type { PupAsset, PupState, PupStats } from "./pup";
import type { PupManifest } from "./manifest";

/**
 * Frontend-derived pup model types. Unlike the wire DTOs in this
 * directory, these shapes are created client-side by pkgController when it
 * enriches bootstrap/store-listing payloads with computed values.
 */

/** Values derived by pkgController.determineCalculatedVals(). */
export interface PupComputedVals {
  isInstalled: boolean;
  statusId: string;
  statusLabel: string;
  installationId: string;
  installationLabel: string;
  unavailableFromSource: boolean;
  /** Convention: /explore/:source_id/:pup_name; null when unavailable. */
  storeURL: string | null;
  /** Convention: /pups/:pup_id/:pup_name; null when not installed. */
  libraryURL: string | null;
}

/** A single version entry within a store-listing pup definition. */
export interface PupDefinitionVersion {
  version?: string;
  manifest?: PupManifest;
}

/**
 * A raw store-listing pup entry (a value of a source's `pups` map from
 * GET /sources/store), before pkgController enriches it with its lookup key
 * and owning source.
 */
export interface StoreListingPupData {
  name?: string;
  latestVersion?: string;
  logoBase64?: string;
  icon?: string;
  versions?: Record<string, PupDefinitionVersion>;
  [key: string]: unknown;
}

/** A single source entry of the GET /sources/store response map. */
export interface SourceData {
  name?: string;
  location?: string;
  type?: string;
  error?: string | null;
  pups?: Record<string, StoreListingPupData>;
  [key: string]: unknown;
}

/** The GET /sources/store response, keyed by source id. */
export type SourceMap = Record<string, SourceData>;

/**
 * A store-listing pup definition, as enriched by
 * pkgController.handleSourcesResponse with its lookup key and owning source
 * (the source's own data minus its `pups` map).
 */
export interface PupDefinition extends StoreListingPupData {
  key?: string;
  source?: { id: string } & Omit<SourceData, "pups">;
}

/** The enriched pup model held in pkgController.pups. */
export interface EnrichedPup {
  computed: PupComputedVals | null;
  def: PupDefinition | null;
  state: PupState | null;
  stats: PupStats | null;
  assets?: PupAsset | null;
}
