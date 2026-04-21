export const FINISHED_JOB_STATUSES = Object.freeze([
  "completed",
  "failed",
  "cancelled",
  "orphaned",
]);

export const ACTIVE_JOB_STATUSES = Object.freeze([
  "queued",
  "in_progress",
]);

export const FAILURE_JOB_STATUSES = Object.freeze([
  "failed",
  "cancelled",
  "orphaned",
]);

export const DELETABLE_JOB_STATUSES = Object.freeze([
  "queued"
]);

export function isFinishedJobStatus(status) {
  return FINISHED_JOB_STATUSES.includes(status);
}

export function isActiveJobStatus(status) {
  return ACTIVE_JOB_STATUSES.includes(status);
}

export function isFailureJobStatus(status) {
  return FAILURE_JOB_STATUSES.includes(status);
}

export function isDeletableJobStatus(status) {
  return DELETABLE_JOB_STATUSES.includes(status);
}
