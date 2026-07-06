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
 * A store-listing pup definition (an entry of a source's `pups` map from
 * GET /sources/store), as enriched by pkgController.handleSourcesResponse
 * with its lookup key and owning source.
 */
export interface PupDefinition {
  key?: string;
  name?: string;
  latestVersion?: string;
  logoBase64?: string;
  icon?: string;
  versions?: Record<string, PupDefinitionVersion>;
  source?: {
    id: string;
    name?: string;
    location?: string;
    type?: string;
  };
}

/** The enriched pup model held in pkgController.pups. */
export interface EnrichedPup {
  computed: PupComputedVals | null;
  def: PupDefinition | null;
  state: PupState | null;
  stats: PupStats | null;
  assets?: PupAsset | null;
}
