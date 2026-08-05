import type { JobStatus } from "/types/jobs";

export const FINISHED_JOB_STATUSES: readonly JobStatus[] = Object.freeze([
  "completed",
  "failed",
  "cancelled",
  "orphaned",
]);

export const ACTIVE_JOB_STATUSES: readonly JobStatus[] = Object.freeze([
  "queued",
  "in_progress",
]);

export const FAILURE_JOB_STATUSES: readonly JobStatus[] = Object.freeze([
  "failed",
  "cancelled",
  "orphaned",
]);

export const DELETABLE_JOB_STATUSES: readonly JobStatus[] = Object.freeze([
  "queued",
]);

export function isFinishedJobStatus(status: JobStatus | string) {
  return FINISHED_JOB_STATUSES.some((candidate) => candidate === status);
}

export function isActiveJobStatus(status: JobStatus | string) {
  return ACTIVE_JOB_STATUSES.some((candidate) => candidate === status);
}

export function isFailureJobStatus(status: JobStatus | string) {
  return FAILURE_JOB_STATUSES.some((candidate) => candidate === status);
}

export function isDeletableJobStatus(status: JobStatus | string) {
  return DELETABLE_JOB_STATUSES.some((candidate) => candidate === status);
}
