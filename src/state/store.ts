import { isUnauthedRoute, hasFlushParam } from "/utils/url-utils.js";
import type { EnrichedPup } from "/types/pup-model";
import type { JobRecord } from "/types/jobs";
import type { PupUpdateInfo } from "/types/pup-updates";

export interface AppContext {
  orientation: string;
  menuVisible: boolean;
  pathname: string;
  pageTitle: string;
  pageAction: string;
  pageCount: number;
  navigationDirection: string;
  dbxVersion: string;
  // Populated at runtime rather than via defaults.
  gitCommit?: string;
  gitDirty?: boolean;
  pathStack?: string[];
  previousPathname?: string;
  upwardPathname?: string;
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
  token: string | false | null;
  demoSystemPrompt: string;
  logStatsUpdates: boolean;
  logStateUpdates: boolean;
  logProgressUpdates: boolean;
  reflectorHost: string;
  reflectorToken: string;
  // Toggled from the devtools debug settings panel.
  includePreReleaseSystemUpdates?: boolean;
  logBootstrapUpdates?: boolean;
  demoInstallPup?: boolean;
  logPupDerivations?: boolean;
  demoPupLifecycle?: boolean;
  /** Dynamic per-endpoint mock toggles (`mock::group::name::method`). */
  [mockToggle: `mock::${string}`]: boolean | undefined;
}

/**
 * The route-scoped pup loaded by the loadPup router middleware: an
 * enriched pup from pkgController plus request status fields.
 */
export interface PupContext extends EnrichedPup {
  ready: boolean;
  /** HTTP-style result of the pup lookup (200, 400, 404, 500). */
  result: number | null;
}

export interface PupUpdatesContext {
  /** Map of pupId -> PupUpdateInfo */
  updateInfo: Record<string, PupUpdateInfo>;
  lastChecked: string | null;
  totalUpdatesAvailable: number;
  isChecking: boolean;
  error: string | null;
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
  // Used by the recovery flow's setup dialogs.
  hideViewClose?: boolean;
  preventClose?: boolean;
}

export interface JobsContext {
  jobs: JobRecord[];
  initialized: boolean;
  loading: boolean;
  error: string | null;
}

export interface SidebarContext {
  /** Pinned pup ids shown in the sidebar. */
  pinned: string[];
}

export interface StoreState {
  appContext: AppContext;
  sysContext: SysContext;
  networkContext: NetworkContext;
  pupContext: PupContext;
  pupUpdatesContext: PupUpdatesContext;
  promptContext: PromptContext;
  dialogContext: DialogContext;
  setupContext: SetupContext;
  jobsContext: JobsContext;
  sidebarContext: SidebarContext;
}

export type StoreSliceKey = keyof StoreState;

export type PartialStoreState = {
  [K in StoreSliceKey]?: Partial<StoreState[K]>;
};

/** Maps getContext() short names to their slice keys. */
interface SliceShortNames {
  app: "appContext";
  sys: "sysContext";
  network: "networkContext";
  pup: "pupContext";
  pupUpdates: "pupUpdatesContext";
  prompt: "promptContext";
  dialog: "dialogContext";
  setup: "setupContext";
  jobs: "jobsContext";
  sidebar: "sidebarContext";
}

export interface StoreSubscriberLike {
  stateChanged(): void;
}

class Store implements StoreState {
  subscribers: StoreSubscriberLike[] = [];

  appContext: AppContext;
  sysContext: SysContext;
  networkContext: NetworkContext;
  pupContext: PupContext;
  pupUpdatesContext: PupUpdatesContext;
  promptContext: PromptContext;
  dialogContext: DialogContext;
  setupContext: SetupContext;
  jobsContext: JobsContext;
  sidebarContext: SidebarContext;

  constructor() {
    this.appContext = {
      orientation: "landscape",
      menuVisible: false,
      pathname: "/",
      pageTitle: "",
      pageAction: "",
      pageCount: 0,
      navigationDirection: "",
      dbxVersion: "",
    };
    this.sysContext = {
      updateAvailable: null,
    };
    this.networkContext = {
      apiBaseUrl: `${window.location.protocol}//${window.location.hostname}:3000`,
      wsApiBaseUrl: `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.hostname}:3000`,
      overrideBaseUrl: false,
      overrideSocketBaseUrl: false,
      useMocks: false,
      forceFailures: false,
      forceDelayInSeconds: 0,
      reqLogs: false,
      status: "online",
      token: false,
      demoSystemPrompt: "",
      logStatsUpdates: false,
      logStateUpdates: false,
      logProgressUpdates: false,
      reflectorHost: `https://reflector.dogecoin.org`,
      reflectorToken: Math.random().toString(36).substring(2, 14),
    };
    this.pupContext = {
      computed: null,
      def: null,
      state: null,
      stats: null,
      ready: false,
      result: null,
    };
    this.pupUpdatesContext = {
      updateInfo: {}, // Map of pupId -> PupUpdateInfo
      lastChecked: null,
      totalUpdatesAvailable: 0,
      isChecking: false,
      error: null,
    };
    this.promptContext = {
      display: false,
      name: "transaction",
    };
    this.dialogContext = {
      name: null,
    };
    this.setupContext = {
      hashedPassword: null,
      view: null,
      useFoundationPupBinaryCache: false,
      useFoundationOSBinaryCache: false,
    };
    this.jobsContext = {
      jobs: [],
      initialized: false,
      loading: false,
      error: null,
    };
    this.sidebarContext = {
      pinned: [],
    };

    // Hydrate state from localStorage unless flush parameter is present.
    if (!isUnauthedRoute() && !hasFlushParam()) {
      this.hydrate();
    }
    if (hasFlushParam()) {
      window.location.href = window.location.origin + window.location.pathname;
    }
  }

  getContext<K extends keyof SliceShortNames>(
    contextName: K,
  ): StoreState[SliceShortNames[K]] | null;
  getContext<K extends StoreSliceKey>(contextName: K): StoreState[K] | null;
  getContext(contextName: string): unknown {
    if (!contextName.endsWith("Context")) {
      contextName = `${contextName}Context`;
    }

    if (this.isSliceKey(contextName)) {
      const slice = this[contextName];
      if (slice) {
        return { ...slice };
      }
    }

    return null;
  }

  /** The store's own `*Context` properties are exactly the state slices. */
  private isSliceKey(key: string): key is StoreSliceKey {
    return (
      Object.prototype.hasOwnProperty.call(this, key) &&
      key.endsWith("Context")
    );
  }

  subscribe(controller: StoreSubscriberLike) {
    this.subscribers.push(controller);
  }

  notifySubscribers() {
    for (const controller of this.subscribers) {
      controller.stateChanged();
    }
  }

  hydrate() {
    // Check if localStorage is supported and accessible
    if (this.supportsLocalStorage()) {
      try {
        // Attempt to parse the saved state from localStorage
        const raw = localStorage.getItem("storeState");
        const savedState: Partial<StoreState> | null = raw
          ? JSON.parse(raw)
          : null;
        if (savedState && savedState.networkContext) {
          this.networkContext = savedState.networkContext;
          if (savedState.sidebarContext) {
            this.sidebarContext = savedState.sidebarContext;
          }
        }
      } catch (error) {
        console.warn(
          "Failed to parse the store state from localStorage. Using defaults.",
        );
      }
    }
  }

  persist() {
    if (this.supportsLocalStorage()) {
      try {
        const stateToPersist = {
          networkContext: this.networkContext,
          sidebarContext: this.sidebarContext,
          // Include other slices of state as needed
        };
        localStorage.setItem("storeState", JSON.stringify(stateToPersist));
      } catch (error) {
        console.warn("Failed to save the store state to localStorage.");
      }
    }
  }

  supportsLocalStorage() {
    try {
      const testKey = "testLocalStorage";
      localStorage.setItem(testKey, testKey);
      localStorage.removeItem(testKey);
      return true;
    } catch (error) {
      return false;
    }
  }

  clearContext(contexts: StoreSliceKey[]) {
    if (!contexts) {
      return;
    }

    contexts.forEach((context) => {
      if (this[context]) {
        // Cleared slices are repopulated by their owners (e.g. the loadPup
        // middleware refills pupContext), so an empty object is acceptable
        // here despite the slice interfaces. Object.assign lets us reset the
        // slice without a type assertion.
        Object.assign(this, { [context]: {} });
      }
    });

    this.persist();
    this.notifySubscribers();
  }

  updateState(partialState: PartialStoreState) {
    // Update the state properties with the partial state provided
    if (partialState.appContext) {
      this.appContext = { ...this.appContext, ...partialState.appContext };
    }
    if (partialState.sysContext) {
      this.sysContext = { ...this.sysContext, ...partialState.sysContext };
    }
    if (partialState.networkContext) {
      this.networkContext = {
        ...this.networkContext,
        ...partialState.networkContext,
      };
    }
    if (partialState.pupContext) {
      this.pupContext = { ...this.pupContext, ...partialState.pupContext };
    }
    if (partialState.pupUpdatesContext) {
      this.pupUpdatesContext = {
        ...this.pupUpdatesContext,
        ...partialState.pupUpdatesContext,
      };
    }
    if (partialState.promptContext) {
      this.promptContext = {
        ...this.promptContext,
        ...partialState.promptContext,
      };
    }
    if (partialState.dialogContext) {
      this.dialogContext = {
        ...this.dialogContext,
        ...partialState.dialogContext,
      };
    }
    if (partialState.setupContext) {
      this.setupContext = {
        ...this.setupContext,
        ...partialState.setupContext,
      };
    }
    if (partialState.jobsContext) {
      this.jobsContext = {
        ...this.jobsContext,
        ...partialState.jobsContext,
      };
    }
    if (partialState.sidebarContext) {
      this.sidebarContext = {
        ...this.sidebarContext,
        ...partialState.sidebarContext,
      };
    }
    // Other slices..

    // After state is updated, persist it and notify subscribers;
    this.persist();
    this.notifySubscribers();
  }
}

export type { Store };

// Important:: Export as a singleton
export const store = new Store();
