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
  computed: any;
  def: any;
  state: any;
  stats: any;
  ready: boolean;
  result: any;
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

export interface Job {
  status: string;
  [key: string]: any;
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

