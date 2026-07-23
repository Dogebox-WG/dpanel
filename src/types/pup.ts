import type {
  ManifestSourceConfiguration as ProtoManifestSourceConfiguration,
  PupAsset as ProtoPupAsset,
  PupHook as ProtoPupHook,
  PupIssues as ProtoPupIssues,
  PupLogos as ProtoPupLogos,
  PupMetricSeries as ProtoPupMetricSeries,
  PupState as ProtoPupState,
  PupStats as ProtoPupStats,
  PupWebUi as ProtoPupWebUi,
} from "/gen/dogebox/v1/types_pb";
import type { Wire } from "./wire";
import type { PupManifest } from "./manifest";

/** PupState.installation lifecycle values (dogeboxd pkg/pups.go STATE_*). */
export type InstallationState =
  | "installing"
  | "upgrading"
  | "ready"
  | "unready"
  | "uninstalling"
  | "uninstalled"
  | "purging"
  | "broken";

/** PupStats.status runtime process values (dogeboxd pkg/pups.go STATE_*). */
export type PupRunState = "stopped" | "starting" | "running" | "stopping";

/** PupState.brokenReason values (dogeboxd pkg/pups.go BROKEN_REASON_*). */
export type BrokenReason =
  | "state_update_failed"
  | "download_failed"
  | "nix_file_missing"
  | "nix_hash_mismatch"
  | "storage_creation_failed"
  | "delegate_key_creation_failed"
  | "delegate_key_write_failed"
  | "enable_failed"
  | "nix_apply_failed";

export type ManifestSourceConfiguration = Wire<ProtoManifestSourceConfiguration>;
export type PupHook = Wire<ProtoPupHook>;
export type PupWebUI = Wire<ProtoPupWebUi>;
export type PupIssues = Wire<ProtoPupIssues>;
export type PupLogos = Wire<ProtoPupLogos>;

/** dogeboxd's Buffer[T] marshals metric values to a plain JSON array. */
export type PupMetricValue = number | string | boolean | null;

export type PupMetrics = Omit<Wire<ProtoPupMetricSeries>, "values"> & {
  values: PupMetricValue[];
};

export type PupState = Omit<
  Wire<ProtoPupState>,
  "installation" | "brokenReason" | "webUis" | "source" | "manifest"
> & {
  // Wire carries the string constants, not proto enum values.
  installation: InstallationState;
  // Empty string when the pup is not broken.
  brokenReason: BrokenReason | "";
  // Wire key is `webUIs` (Go json tag); generated field is webUis.
  webUIs: PupWebUI[];
  // Go always marshals nested structs; proto3 message fields generate optional.
  source: ManifestSourceConfiguration;
  manifest: PupManifest;
};

export type PupStats = Omit<
  Wire<ProtoPupStats>,
  "status" | "systemMetrics" | "metrics" | "issues"
> & {
  // Wire carries the string constants, not proto enum values.
  status: PupRunState;
  systemMetrics: PupMetrics[];
  metrics: PupMetrics[];
  issues: PupIssues;
};

export type PupAsset = Omit<Wire<ProtoPupAsset>, "logos"> & {
  logos: PupLogos;
};
