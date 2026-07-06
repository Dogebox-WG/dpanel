import type {
  ActionProgress as ProtoActionProgress,
  JobRecord as ProtoJobRecord,
} from "/gen/dogebox/v1/types_pb";
import type { Wire } from "./wire";

/** JobRecord.status values (dogeboxd pkg/jobs.go JobStatus). */
export type JobStatus =
  | "queued"
  | "in_progress"
  | "completed"
  | "failed"
  | "cancelled"
  | "orphaned";

export type JobRecord = Omit<
  Wire<ProtoJobRecord>,
  "status" | "started" | "finished" | "pupId" | "targetVersion"
> & {
  // Wire carries the string constants, not proto enum values.
  status: JobStatus;
  // Go time.Time marshals to RFC3339 strings, not proto Timestamps.
  started: string;
  finished: string | null;
  // Wire key is `pupID` (Go json tag); generated field is pupId.
  pupID: string;
  // omitempty on the Go side.
  targetVersion?: string;
};

export type ActionProgress = Omit<
  Wire<ProtoActionProgress>,
  "actionId" | "pupId" | "stepTaken"
> & {
  // Wire keys are `actionID`/`pupID` (Go json tags); generated fields are
  // actionId/pupId.
  actionID: string;
  pupID: string;
  // Go time.Duration marshals to nanoseconds, not a proto Duration; the
  // json tag keeps the snake_case name.
  step_taken: number;
};
