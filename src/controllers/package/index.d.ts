// Minimal type bridge for the package controller, covering only the surface
// currently consumed from TypeScript. Replaced by real declarations when
// pkgController itself migrates to TypeScript in Phase 3.
import type { PupState, PupStats, PupAsset } from "/types/pup";

export interface PkgController {
  stateIndex: Record<string, PupState>;
  statsIndex: Record<string, PupStats>;
  assetIndex: Record<string, PupAsset>;
  hasLoadedSources: boolean;
  [key: string]: unknown;
}

export const pkgController: PkgController;
