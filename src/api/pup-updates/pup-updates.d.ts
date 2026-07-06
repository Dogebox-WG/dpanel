// Type bridge for pup-updates.js until the api modules migrate to
// TypeScript in Phase 4.
import type { PupUpdateInfo } from "/types/pup-updates";

export function getAllPupUpdates(): Promise<Record<string, PupUpdateInfo>>;
export function getPupUpdate(pupId: string): Promise<PupUpdateInfo>;
export function checkPupUpdates(pupId: string): Promise<unknown>;
export function upgradePup(pupId: string, targetVersion: string): Promise<unknown>;
export function rollbackPup(pupId: string): Promise<unknown>;
export function getSkippedUpdates(): Promise<Record<string, string>>;
export function skipPupUpdate(pupId: string): Promise<unknown>;
export function clearSkippedUpdate(pupId: string): Promise<unknown>;
