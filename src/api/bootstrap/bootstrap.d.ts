// Type bridge for bootstrap.js until the api modules migrate to TypeScript
// in Phase 4.
import type { BootstrapResponse } from "/types/bootstrap";

export function getBootstrap(): Promise<unknown>;
export function getBootstrapV2(): Promise<BootstrapResponse>;
export function doBootstrap(): Promise<void>;
