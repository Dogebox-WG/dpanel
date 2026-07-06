/**
 * Wire-accurate DTO types for dogeboxd payloads.
 *
 * The master definitions are the protobuf schemas in dogeboxd's protocol/
 * directory, generated into /gen by `npm run generate`. These modules adapt
 * the generated types to the current JSON wire format (Go encoding/json);
 * each override is commented with the divergence it covers and can be
 * deleted as endpoints migrate to connectrpc.
 */
export type { Wire } from "./wire";
export type {
  InstallationState,
  PupRunState,
  BrokenReason,
  ManifestSourceConfiguration,
  PupHook,
  PupWebUI,
  PupIssues,
  PupLogos,
  PupMetricValue,
  PupMetrics,
  PupState,
  PupStats,
  PupAsset,
} from "./pup";
export type {
  PupManifest,
  PupManifestMeta,
  PupManifestBuild,
  PupManifestCommand,
  PupManifestService,
  PupManifestContainer,
  PupManifestExposeConfig,
  PupManifestInterface,
  PupManifestPermissionGroup,
  PupManifestDependency,
  PupManifestDependencySource,
  PupManifestConfigFields,
  PupManifestConfigSection,
  PupManifestConfigField,
  PupManifestConfigFieldType,
  PupManifestMetric,
} from "./manifest";
export type { JobStatus, JobRecord, ActionProgress } from "./jobs";
export type {
  PupInterfaceChangeType,
  PupInterfaceVersion,
  PupVersion,
  PupUpdateInfo,
  PupUpdatesCheckedEvent,
} from "./pup-updates";
export type {
  DBXVersionInfo,
  DBXVersionInfoGit,
  DBXVersionInputTuple,
  BootstrapFlags,
  BootstrapFacts,
  SidebarPreferences,
  BootstrapResponse,
  BootstrapInstallationBootMedia,
  BootstrapInstallationState,
  RecoveryFacts,
  BootstrapRecoveryResponse,
} from "./bootstrap";
export type {
  Change,
  PupPurgedUpdate,
  JobsBootstrap,
  JobLifecycleChangeType,
  MainChannelMessage,
  JobChannelMessage,
} from "./websocket";
