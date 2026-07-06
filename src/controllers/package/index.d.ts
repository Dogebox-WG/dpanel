// Minimal type bridge for the package controller, covering only the surface
// currently consumed from TypeScript. Replaced by real declarations when
// pkgController itself migrates to TypeScript in Phase 3.
import type { PupState, PupStats, PupAsset } from "/types/pup";
import type { ActionProgress } from "/types/jobs";
import type { Change } from "/types/websocket";

/** Ordering metadata forwarded from the websocket Change envelope. */
export interface ChangeMeta {
  seq?: number;
  ts?: number;
}

export interface PkgController {
  stateIndex: Record<string, PupState>;
  statsIndex: Record<string, PupStats>;
  assetIndex: Record<string, PupAsset>;
  hasLoadedSources: boolean;

  updatePupModel(pupId: string, state: PupState, meta?: ChangeMeta): void;
  updatePupStatsModel(pupId: string, stats: PupStats, meta?: ChangeMeta): void;
  removePupById(pupId: string | undefined, meta?: ChangeMeta): void;
  resolveAction(
    actionId: string,
    change: Change<"action", unknown>,
    meta?: ChangeMeta,
  ): void;
  ingestProgressUpdate(change: Change<"progress", ActionProgress>): void;
  recomputeAllDerivedValues(): void;

  [key: string]: unknown;
}

export const pkgController: PkgController;
