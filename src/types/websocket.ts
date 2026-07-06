import type { BootstrapResponse } from "./bootstrap";
import type { ActionProgress, JobRecord } from "./jobs";
import type { PupState, PupStats } from "./pup";
import type { PupUpdatesCheckedEvent } from "./pup-updates";

/**
 * The JSON wire envelope for every message on the state and jobs websocket
 * channels (dogeboxd pkg/events.go Change). The proto Change message models
 * the payload as a oneof, but the current JSON wire keys the `update` shape
 * off the `type` string, so we model each (type, update) pair as a
 * discriminated union member instead.
 */
export interface Change<TType extends string = string, TUpdate = unknown> {
  id: string;
  /** Monotonic sequence number, assigned server-side when emitted. */
  seq?: number;
  /** Server timestamp in milliseconds since epoch, assigned when emitted. */
  ts?: number;
  error?: string;
  type: TType;
  update: TUpdate;
}

export interface PupPurgedUpdate {
  pupId: string;
}

export interface JobsBootstrap {
  jobs: JobRecord[];
}

/**
 * Job lifecycle events emitted by dogeboxd's JobManager. job:cancelled has
 * no backend emission path today but matches the cancelled JobStatus and is
 * emitted by the dev mock socket.
 */
export type JobLifecycleChangeType =
  | "job:created"
  | "job:updated"
  | "job:completed"
  | "job:failed"
  | "job:cancelled"
  | "job:orphaned"
  | "job:deleted";

/**
 * Messages received on the main state channel (/ws/state/).
 *
 * Note both websocket endpoints share dogeboxd's WSRelay, so job lifecycle
 * events appear here too.
 */
export type MainChannelMessage =
  | Change<"bootstrap", BootstrapResponse>
  | Change<"pup", PupState>
  | Change<"pup_purged", PupPurgedUpdate>
  // Bare array on the wire, not a StatsUpdate wrapper.
  | Change<"stats", PupStats[]>
  // Action results vary by action (PupState for pup actions, ad hoc shapes
  // for check-updates and initial bootstrap); narrow at the call site.
  | Change<"action", unknown>
  | Change<"progress", ActionProgress>
  // Synthetic client-side prompt event; carries `name` at the top level
  // rather than in `update` (see the demoSystemPrompt mock runner).
  | { type: "prompt"; name: string; seq?: number; ts?: number; error?: string }
  | Change<"system-update-available", unknown>
  | Change<"recovery", string>
  | Change<"pup-updates-checked", PupUpdatesCheckedEvent>
  | Change<JobLifecycleChangeType, JobRecord>
  // Legacy underscore variant still emitted by the SystemUpdater
  // completion path.
  | Change<"job_completed", JobRecord>;

/** Messages received on the jobs channel (/ws/jobs). */
export type JobChannelMessage =
  | Change<"bootstrap", JobsBootstrap>
  | Change<JobLifecycleChangeType, JobRecord>;
