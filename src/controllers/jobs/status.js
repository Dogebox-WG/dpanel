// Bridge module: the implementation now lives in status.impl.ts. Existing
// imports of /controllers/jobs/status.js keep working until the Phase 4
// cleanup renames the .impl modules to their canonical names.
export {
  FINISHED_JOB_STATUSES,
  ACTIVE_JOB_STATUSES,
  FAILURE_JOB_STATUSES,
  DELETABLE_JOB_STATUSES,
  isFinishedJobStatus,
  isActiveJobStatus,
  isFailureJobStatus,
  isDeletableJobStatus,
} from "./status.impl.ts";
