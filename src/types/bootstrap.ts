import type {
  BootstrapFacts as ProtoBootstrapFacts,
  BootstrapFlags as ProtoBootstrapFlags,
  BootstrapRecoveryResponse as ProtoBootstrapRecoveryResponse,
  BootstrapResponse as ProtoBootstrapResponse,
  DBXVersionInfo as ProtoDBXVersionInfo,
  DBXVersionInfoGit as ProtoDBXVersionInfoGit,
  DBXVersionInputTuple as ProtoDBXVersionInputTuple,
  RecoveryFacts as ProtoRecoveryFacts,
  SidebarPreferences as ProtoSidebarPreferences,
} from "/gen/dogebox/v1/bootstrap_pb";
import type { Wire } from "./wire";
import type { PupAsset, PupState, PupStats } from "./pup";
import type { JobStatus } from "./jobs";

export type DBXVersionInfoGit = Wire<ProtoDBXVersionInfoGit>;
export type DBXVersionInputTuple = Wire<ProtoDBXVersionInputTuple>;

export type DBXVersionInfo = Omit<Wire<ProtoDBXVersionInfo>, "git"> & {
  // Go always marshals nested structs; proto3 message fields generate optional.
  git: DBXVersionInfoGit;
};

export type BootstrapFlags = Wire<ProtoBootstrapFlags>;

export type BootstrapFacts = Omit<
  Wire<ProtoBootstrapFacts>,
  | "setupSessionId"
  | "activeBootstrapJobId"
  | "activeSystemUpdateJobId"
  | "activeSystemUpdateStatus"
> & {
  setupSessionId: string;
  // omitempty on the Go side.
  activeBootstrapJobId?: string;
  activeSystemUpdateJobId?: string;
  activeSystemUpdateStatus?: JobStatus;
};

export type SidebarPreferences = Wire<ProtoSidebarPreferences>;

export type BootstrapResponse = Omit<
  Wire<ProtoBootstrapResponse>,
  "version" | "assets" | "states" | "stats" | "flags" | "setupFacts" | "sidebarPreferences"
> & {
  // Nullable pointer on the Go side.
  version: DBXVersionInfo | null;
  assets: Record<string, PupAsset>;
  states: Record<string, PupState>;
  stats: Record<string, PupStats>;
  flags: BootstrapFlags;
  setupFacts: BootstrapFacts;
  sidebarPreferences: SidebarPreferences;
};

/** Recovery bootstrap wire values (dogeboxd pkg/sys.go). */
export type BootstrapInstallationBootMedia = "ro" | "rw";
export type BootstrapInstallationState =
  | "unconfigured"
  | "notInstalled"
  | "configured";

export type RecoveryFacts = Omit<
  Wire<ProtoRecoveryFacts>,
  "installationBootMedia" | "installationState"
> & {
  // Wire carries the string constants, not proto enum values.
  installationBootMedia: BootstrapInstallationBootMedia;
  installationState: BootstrapInstallationState;
};

export type BootstrapRecoveryResponse = Omit<
  Wire<ProtoBootstrapRecoveryResponse>,
  "recoveryFacts"
> & {
  recoveryFacts: RecoveryFacts;
};
