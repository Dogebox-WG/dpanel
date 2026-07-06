// Type bridge for sources.js until the api modules migrate to TypeScript in
// Phase 4.
import type { SourceMap } from "/types/pup-model";

export function getStoreListing(shouldFlush?: boolean): Promise<SourceMap>;
export function refreshStoreListing(shouldFlush?: boolean): Promise<SourceMap>;
