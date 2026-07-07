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

export function isFinishedJobStatus(status: JobStatus | string): boolean {
  return FINISHED_JOB_STATUSES.includes(status as JobStatus);
}

export function isActiveJobStatus(status: JobStatus | string): boolean {
  return ACTIVE_JOB_STATUSES.includes(status as JobStatus);
}

export function isFailureJobStatus(status: JobStatus | string): boolean {
  return FAILURE_JOB_STATUSES.includes(status as JobStatus);
}

export function isDeletableJobStatus(status: JobStatus | string): boolean {
  return DELETABLE_JOB_STATUSES.includes(status as JobStatus);
}
