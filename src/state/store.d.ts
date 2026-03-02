import type { BootstrapResponse as ProtoBootstrapResponse } from "/gen/dogebox/v1/bootstrap_pb";
import type {
  JobRecord as ProtoJobRecord,
  PupAsset as ProtoPupAsset,
  PupManifest as ProtoPupManifest,
  PupState as ProtoPupState,
  PupStats as ProtoPupStats,
} from "/gen/dogebox/v1/types_pb";

export type PupInstallationState =
  | "installing"
  | "upgrading"
  | "ready"
  | "unready"
  | "uninstalling"
  | "uninstalled"
  | "purging"
  | "broken";

export type PupRuntimeStatus = "stopped" | "starting" | "running" | "stopping";

export type JobStatus = "queued" | "in_progress" | "completed" | "failed" | "cancelled";

export type PupState = Omit<ProtoPupState, "installation"> & {
  installation: PupInstallationState;
};

export type PupStats = Omit<ProtoPupStats, "status"> & {
  status: PupRuntimeStatus;
};

export type PupAsset = ProtoPupAsset;
export type PupManifest = ProtoPupManifest;

export type Job = Omit<ProtoJobRecord, "status" | "started" | "finished"> & {
  status: JobStatus;
  started: string;
  finished?: string | null;
};

export type BootstrapResponse = Omit<ProtoBootstrapResponse, "ts" | "states" | "stats" | "assets"> & {
  ts: number;
  states: Record<string, PupState>;
  stats: Record<string, PupStats>;
  assets: Record<string, PupAsset>;
};

export interface AppContext {
  orientation: string;
  menuVisible: boolean;
  pathname: string;
  pageTitle: string;
  pageAction: string;
  pageCount: number;
  navigationDirection: string;
  dbxVersion: string;
}

export interface SysContext {
  updateAvailable: boolean | null;
}

export interface NetworkContext {
  apiBaseUrl: string;
  wsApiBaseUrl: string;
  overrideBaseUrl: boolean;
  overrideSocketBaseUrl: boolean;
  useMocks: boolean;
  forceFailures: boolean;
  forceDelayInSeconds: number;
  reqLogs: boolean;
  status: string;
  token: boolean | string;
  demoSystemPrompt: string;
  logStatsUpdates: boolean;
  logStateUpdates: boolean;
  logProgressUpdates: boolean;
  reflectorHost: string;
  reflectorToken: string;
}

export interface PupContext {
  computed: Record<string, unknown> | null;
  def: PupManifest | Record<string, unknown> | null;
  state: PupState | null;
  stats: PupStats | null;
  ready: boolean;
  result: Record<string, unknown> | null;
}

export interface PromptContext {
  display: boolean;
  name: string;
}

export interface DialogContext {
  name: string | null;
}

export interface SetupContext {
  hashedPassword: string | null;
  view: string | null;
  useFoundationPupBinaryCache: boolean;
  useFoundationOSBinaryCache: boolean;
}

export interface JobsContext {
  jobs: Job[];
  loading: boolean;
  error: string | null;
}

export interface Store {
  appContext: AppContext;
  sysContext: SysContext;
  networkContext: NetworkContext;
  pupContext: PupContext;
  promptContext: PromptContext;
  dialogContext: DialogContext;
  setupContext: SetupContext;
  jobsContext: JobsContext;
  subscribe(controller: any): void;
  updateState(partialState: Partial<{
    appContext: Partial<AppContext>;
    sysContext: Partial<SysContext>;
    networkContext: Partial<NetworkContext>;
    pupContext: Partial<PupContext>;
    promptContext: Partial<PromptContext>;
    dialogContext: Partial<DialogContext>;
    setupContext: Partial<SetupContext>;
    jobsContext: Partial<JobsContext>;
  }>): void;
  getContext(contextName: string): any;
  clearContext(contexts: string[]): void;
}

export const store: Store;

