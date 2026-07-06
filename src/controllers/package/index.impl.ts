import { postConfig } from "/api/config/config.js";
import { pickAndPerformPupAction } from "/api/action/action.js";
import { isActiveJobStatus } from "/controllers/jobs/status.js";
import { store } from "/state/store.js";
import type { PupState, PupStats, PupAsset } from "/types/pup";
import type {
  EnrichedPup,
  PupComputedVals,
  PupDefinition,
  SourceData,
  SourceMap,
} from "/types/pup-model";
import type { ActionProgress, JobRecord } from "/types/jobs";
import type { BootstrapResponse } from "/types/bootstrap";
import type { Change } from "/types/websocket";

/** Ordering metadata forwarded from the websocket Change envelope. */
export interface ChangeMeta {
  seq?: number;
  ts?: number;
}

export interface PkgObserver {
  pupId?: string;
  requestUpdate(options?: Record<string, unknown>): void;
  updatePups?(): void;
}

export interface ActionCallbacks {
  onSuccess: (payload?: unknown) => void;
  onError: (payload?: unknown) => void;
  onTimeout?: () => void;
}

export type RegisteredActionType = "UPDATE-PUP" | "PUP-ACTION";

export interface RegisteredAction {
  txn: string;
  callbacks: ActionCallbacks;
  actionType: RegisteredActionType;
  pupId: string;
  /** Concrete pup action name (enable, disable, ...) for PUP-ACTION entries. */
  action?: string;
  issuedAt: number;
  expireAt: number | false;
}

export interface PupMasterLookup {
  pupId?: string;
  sourceId?: string;
  pupName?: string;
  lookupType?: string;
}

export interface SourceListItem {
  sourceId: string;
  location: string;
  name: string;
  pupCount: number;
  installedCount: number;
  error: string | null;
}

interface StatusDescriptor {
  id: string;
  label: string;
}

/** Progress updates use inconsistent pup id casing on the wire. */
type ProgressUpdate = ActionProgress & { PupID?: string; pupId?: string };

class PkgController {
  observers: PkgObserver[] = [];
  actions: RegisteredAction[] = [];

  pups: EnrichedPup[] = [];
  stateIndex: Record<string, PupState> = {};
  statsIndex: Record<string, PupStats> = {};
  sourcesIndex: SourceMap = {};
  hasLoadedSources = false;
  assetIndex: Record<string, PupAsset> = {};
  activityIndex: Record<string, ActionProgress[]> = {};

  // Client-side freshness tracking: last seen server timestamps for per-pup updates from websockets.
  // Used to avoid regressing state when an older bootstrap snapshot arrives.
  lastWsTsByPupId: Record<string, number> = {};

  constructor() {
    this.transactionTimeoutChecker();
  }

  // Register an observer
  addObserver(observer: PkgObserver): void {
    if (!this.observers.includes(observer)) {
      this.observers.push(observer);
    }
  }

  // Remove an observer
  removeObserver(observer: PkgObserver): void {
    const index = this.observers.indexOf(observer);
    if (index > -1) {
      this.observers.splice(index, 1);
    }
  }

  // Notify all registered observers of a state change
  notify(pupId?: string | null, options: Record<string, unknown> = {}): void {
    for (const observer of this.observers) {
      if (!pupId) {
        observer.requestUpdate(options);
      }
      if (pupId === observer.pupId) {
        observer.requestUpdate(options);
      }
      if (typeof observer.updatePups === "function") {
        observer.updatePups();
      }
    }
  }

  setData(bootstrapResponseV2: BootstrapResponse, meta: ChangeMeta = {}): void {
    const { states, stats, assets, sidebarPreferences } = bootstrapResponseV2;
    this.handleBootstrapResponse(states, stats, assets, { ...meta, ts: bootstrapResponseV2?.ts });

    // Update store with sidebar preferences from backend
    if (sidebarPreferences) {
      store.updateState({
        sidebarContext: {
          pinned: sidebarPreferences.sidebarPups || [],
        },
      });
    }

    this.notify();
  }

  setStoreData(storeListingRes: SourceMap): void {
    this.handleSourcesResponse(storeListingRes);
    this.notify();
  }

  handleBootstrapResponse(
    states: Record<string, PupState> | null | undefined,
    stats: Record<string, PupStats> | null | undefined,
    assets: Record<string, PupAsset> | null | undefined,
    meta: ChangeMeta = {},
  ): void {
    const incomingStates = states || {};
    const incomingStats = stats || {};
    const incomingAssets = assets || {};
    const bootstrapTs = meta.ts || 0;

    const prevPups = this.pups || [];
    const prevStateIndex = this.stateIndex || {};
    const prevStatsIndex = this.statsIndex || {};
    const prevAssetsIndex = this.assetIndex || {};

    // Start with the incoming snapshot, then selectively preserve newer websocket-derived entries.
    this.stateIndex = { ...incomingStates };
    this.statsIndex = { ...incomingStats };
    this.assetIndex = { ...incomingAssets };
    this.pups = [];

    const shouldPreserve = (pupId: string): boolean => {
      const wsTs = this.lastWsTsByPupId?.[pupId] || 0;
      return bootstrapTs > 0 && wsTs > bootstrapTs;
    };

    // Preserve newer ws updates for any pup present in incoming snapshot.
    for (const pupId of Object.keys(this.stateIndex)) {
      if (!shouldPreserve(pupId)) continue;
      if (prevStateIndex[pupId]) this.stateIndex[pupId] = prevStateIndex[pupId];
      if (prevStatsIndex[pupId]) this.statsIndex[pupId] = prevStatsIndex[pupId];
      if (prevAssetsIndex[pupId]) this.assetIndex[pupId] = prevAssetsIndex[pupId];
    }

    // Also preserve ws-created pups that aren't yet present in the snapshot (rare, but possible).
    for (const pupId of Object.keys(prevStateIndex)) {
      if (this.stateIndex[pupId]) continue;
      if (!shouldPreserve(pupId)) continue;
      this.stateIndex[pupId] = prevStateIndex[pupId];
      if (prevStatsIndex[pupId]) this.statsIndex[pupId] = prevStatsIndex[pupId];
      if (prevAssetsIndex[pupId]) this.assetIndex[pupId] = prevAssetsIndex[pupId];
    }

    for (const [stateKey, stateData] of Object.entries(this.stateIndex)) {

      // Do we have this pup in memory?
      const existingIndex = prevPups.findIndex((p) => p?.state?.id === stateKey);
      const existing = existingIndex >= 0 ? prevPups[existingIndex] : null;

      // Update it in place.
      if (existing) {
        this.pups.push({
          ...existing,
          state: stateData,
          stats: this.statsIndex[stateKey],
          assets: this.assetIndex[stateKey],
        });
        this.pups[this.pups.length - 1].computed = {
          ...(this.pups[this.pups.length - 1].computed || {}),
          ...this.determineCalculatedVals(this.pups[this.pups.length - 1]),
        } as PupComputedVals;
      }

      if (!existing) {
        const newPup: EnrichedPup = {
          computed: null,
          def: null,
          state: stateData,
          stats: this.statsIndex[stateKey],
          assets: this.assetIndex[stateKey],
        };
        newPup.computed = this.determineCalculatedVals(newPup);
        this.pups.push(newPup);
      }
    }
  }

  determineCalculatedVals(pup: EnrichedPup): PupComputedVals | null {
    const isInstalled = !!pup.state;
    const unavailableFromSource = this.isPupUnavailableFromSource(pup);

    const activeActions = pup.state?.id ? this.getActionsForPup(pup.state.id) : [];
    const activeJobs = pup.state?.id ? this.getJobsForPup(pup.state.id) : [];
    // Determining the status here allows the correct status to persist a page refresh
    const status = determineStatusId(pup.state, pup.stats, activeActions, activeJobs);
    const installation = determineInstallationId(pup.state);
    let out: PupComputedVals | null = null;
    try {
      out = {
        isInstalled,
        statusId: status.id,
        statusLabel: status.label,
        installationId: installation.id,
        installationLabel: installation.label,
        unavailableFromSource,
        // Convention: /explore/:source_id/:pup_name
        storeURL: unavailableFromSource && !pup.def
          ? null
          : isInstalled
          ? `/explore/${pup.state!.source.id}/${encodeURIComponent(pup.state!.manifest.meta.name)}`
          : `/explore/${pup.def!.source!.id}/${encodeURIComponent(pup.def!.key!)}`,
        // Convention: /pups/:pup_id/:pup_name
        libraryURL: isInstalled
          ? `/pups/${pup.state!.id}/${encodeURIComponent(pup.state!.manifest.meta.name)}`
          : null,
      };
    } catch (err) {
      console.error("error occurred with computed vals", err);
    }
    return out;
  }

  isPupUnavailableFromSource(pup: EnrichedPup): boolean {
    if (!this.hasLoadedSources) return false;

    const sourceId = pup?.state?.source?.id;
    const pupName = pup?.state?.manifest?.meta?.name;
    if (!sourceId || !pupName) return false;

    // If the source itself no longer exists, treat the installed pup as unavailable
    const sourceData = this.sourcesIndex?.[sourceId];
    if (!sourceData) return true;

    if (sourceData.error) {
      if (
        sourceData.type === "disk" &&
        /source path does not exist/i.test(sourceData.error)
      ) {
        // A configured disk source whose root path has been deleted is unavailable.
        return true;
      }

      // Other source refresh failures should not mark every installed pup as unavailable.
      return false;
    }

    // If the source no longer includes the pup, treat the installed pup as unavailable
    return !sourceData.pups?.[pupName];
  }

  handleSourcesResponse(sources: SourceMap): void {
    this.sourcesIndex = sources;
    this.hasLoadedSources = true;

    // Keep installed pups visible even if they were removed or updated underneath us.
    // Source defs are pruned here, but installed state remains in the library.
    const prunedPups: EnrichedPup[] = [];
    for (const pup of this.pups) {
      const sourceId = pup?.def?.source?.id;
      const defKey = pup?.def?.key;

      if (!sourceId || !defKey) {
        prunedPups.push(pup);
        continue;
      }

      const sourceData = sources?.[sourceId];
      if (sourceData?.error) {
        prunedPups.push(pup);
        continue;
      }
      const sourceStillHasPup = Boolean(sourceData?.pups?.[defKey]);

      if (sourceStillHasPup) {
        prunedPups.push(pup);
        continue;
      }

      if (pup.state) {
        prunedPups.push({
          ...pup,
          def: null,
        });
      }
    }

    this.pups = prunedPups;

    try {
      for (const [sourceId, sourceData] of Object.entries(sources)) {
        for (const [pkgName, pupDefinitionData] of Object.entries(sourceData.pups || {})) {

          // Do we have this pup in memory?
          const foundIndex = this.pups.findIndex((pup) => (
            (pup?.state?.source?.id === sourceId &&
            pup?.state?.manifest?.meta?.name === pkgName)) ||
            (pup?.def?.source?.id === sourceId &&
            pup?.def?.key === pkgName)
          );

          const def: PupDefinition = {
            ...pupDefinitionData,
            key: pkgName,
            source: {
              id: sourceId,
              ...sourceData,
            },
          };

          // Avoid adding the .pups[] property of the source to a specific pups def.
          delete (def.source as SourceData).pups;

          // Update it in place.
          const found = foundIndex >= 0;
          if (found) {
            this.pups[foundIndex] = {
              ...this.pups[foundIndex],
              def,
            };
            this.pups[foundIndex].computed = {
              ...this.pups[foundIndex].computed,
              ...this.determineCalculatedVals(this.pups[foundIndex]),
            } as PupComputedVals;
          }

          // Not found. create and push to pups array.
          if (!found) {
            const pup: EnrichedPup = {
              computed: null,
              def,
              state: null,
              stats: null,
              assets: null,
            };
            pup.computed = this.determineCalculatedVals(pup);
            this.pups.push(pup);
          }
        }
      }

      this.pups = this.pups.map((pup) => ({
        ...pup,
        computed: this.determineCalculatedVals(pup),
      }));
    } catch (definitionProcessingError) {
      console.error(definitionProcessingError);
    }
  }

  getPupMaster({ pupId, sourceId, pupName, lookupType }: PupMasterLookup): {
    pup: EnrichedPup | null;
    index: number;
  } {
    try {
      let result: EnrichedPup | null = null;
      let index = -1;

      if (pupId && this.stateIndex[pupId]) {
        index = this.pups.findIndex((p) => p?.state?.id === pupId);
        result = index !== -1 ? this.pups[index] : null;
      }

      if (!result && sourceId && this.sourcesIndex[sourceId] && pupName && this.sourcesIndex[sourceId].pups?.[pupName]) {
        index = this.pups.findIndex((p) => p?.def?.source?.id === sourceId && p?.def?.key === pupName);
        result = index !== -1 ? this.pups[index] : null;
      }

      return { pup: result, index };
    } catch (err) {
      console.warn("pup lookup warning:", err);
      return { pup: null, index: -1 };
    }
  }

  removePupsBySourceId(sourceId: string): void {
    this.pups = this.pups.filter((p) => p?.def?.source?.id !== sourceId);
    if (this.sourcesIndex[sourceId]) {
      delete this.sourcesIndex[sourceId];
    }
    this.notify();
  }

  removePupById(pupId: string | undefined, meta: ChangeMeta = {}): void {
    if (!pupId) return;
    delete this.stateIndex[pupId];
    delete this.statsIndex[pupId];
    delete this.assetIndex[pupId];
    delete this.activityIndex[pupId];
    this.pups = this.pups.filter((p) => p?.state?.id !== pupId);
    this.notify();
  }

  registerAction(
    txn: string,
    callbacks: ActionCallbacks,
    actionType: RegisteredActionType,
    pupId: string,
    timeout?: number,
    action?: string,
  ): void {
    if (!txn || !callbacks || !actionType || !pupId) {
      console.warn(
        `
        pkgController: MALFORMED REGISTER ACTION REQUEST.
        Expecting: txn, callbacks, actionType & pupId`,
        { txn, callbacks, actionType, pupId },
      );
      return;
    }

    if (typeof callbacks.onSuccess !== "function") {
      console.warn("pkgController: ACTION SUCCESS CALLBACK NOT A FUNCTION.", {
        txn,
        callbacks,
      });
      return;
    }

    if (typeof callbacks.onError !== "function") {
      console.warn("pkgController: ACTION ERROR CALLBACK NOT A FUNCTION.", {
        txn,
        callbacks,
      });
      return;
    }

    const issuedAt = Date.now();
    const expireAt = timeout ? issuedAt + timeout : false;

    this.actions.push({
      txn,
      callbacks,
      actionType,
      pupId,
      action,
      issuedAt,
      expireAt,
    });
  }

  resolveAction(txn: string, payload: Change<"action", unknown>, meta: ChangeMeta = {}): void {
    const foundActionIndex = this.actions.findIndex(
      (action) => action.txn === txn,
    );
    const foundAction =
      foundActionIndex !== -1 ? this.actions[foundActionIndex] : null;
    if (!foundAction) {
      console.warn("pkgController: ACTION NOT FOUND.", { txn });
      return;
    }

    // Txn failed, invoke error callback.
    if (!payload || payload.error) {
      try {
        // Remove action from actions list.
        this.actions.splice(foundActionIndex, 1);
        // Invoke error callback
        foundAction.callbacks.onError(payload);
      } catch (err) {
        console.warn("the provided onError callback function threw an error");
      }
      return;
    }

    switch (foundAction.actionType) {
      case "UPDATE-PUP":
        this.updatePupModel(foundAction.pupId, payload.update as PupState, meta);
        break;
      case "PUP-ACTION":
        // TODO.
        if (foundAction.pupId === "--") {
          return;
        }
        this.updatePupModel(foundAction.pupId, payload.update as PupState, meta);
        break;
    }

    // Txn succeeded, invoke success callback.
    try {
      // Remove action from actions list.
      this.actions.splice(foundActionIndex, 1);
      // Invoke success callback
      foundAction.callbacks.onSuccess(payload);
    } catch (err) {
      console.warn("the provided onSuccess callback function threw an error");
    }
  }

  updatePupStatsModel(pupId: string, newPupStatsData: PupStats, meta: ChangeMeta = {}): void {
    if (this.stateIndex[newPupStatsData.id]) {
      // Update index data in place.
      this.statsIndex[newPupStatsData.id] = newPupStatsData;

      // Update pup array data in place
      const foundIndex = this.pups.findIndex((p) => p?.state?.id === newPupStatsData.id);
      if (foundIndex >= 0) {
        this.pups[foundIndex].stats = newPupStatsData;
        this.pups[foundIndex].computed = this.determineCalculatedVals(this.pups[foundIndex]);
      }

      if (meta?.ts) {
        const id = newPupStatsData.id;
        const prev = this.lastWsTsByPupId?.[id] || 0;
        this.lastWsTsByPupId[id] = Math.max(prev, meta.ts);
      }

      // Notify subscribers of change
      this.notify();

    } else {
      // Not handled.  Pup stats data only updated if pup is in memory.
      // Todo. Reconsider this assumption as needed.
    }
  }

  updatePupModel(pupId: string, newPupStateData: PupState, meta: ChangeMeta = {}): void {
    if (!isValidState(newPupStateData)) {
      console.warn("Validation error. Invalid pupState structure");
      return;
    }

    const n = newPupStateData;
    const { pup, index } = this.getPupMaster({ pupId: n.id, sourceId: n.source.id, pupName: n.manifest.meta.name });

    if (pup) {
      this.stateIndex[newPupStateData.id] = newPupStateData;

      // Update pup array data in place
      const updated: EnrichedPup = {
        ...this.pups[index],
        state: newPupStateData,
      };

      updated.computed = this.determineCalculatedVals(updated);

      this.pups[index] = updated;
    } else {
      // When receiving a pupState event for a pup NOT found in the stateIndex
      // We add it as a new entry.  This is likely a record for a newly installed pup
      // The user has clicked "install", and the client has received a pup event before
      // the user has called /bootstrap.
      const pup: EnrichedPup = {
        computed: null,
        def: (this.sourcesIndex[newPupStateData.source.id]?.pups?.[newPupStateData.manifest.meta.name] as PupDefinition | undefined) || null,
        state: newPupStateData,
        assets: null,
        stats: this.statsIndex[newPupStateData.id] || null,
      };
      pup.computed = this.determineCalculatedVals(pup);

      this.stateIndex[pup.state!.id] = newPupStateData;
      this.pups.push(pup);
    }

    if (meta?.ts) {
      const id = newPupStateData.id;
      const prev = this.lastWsTsByPupId?.[id] || 0;
      this.lastWsTsByPupId[id] = Math.max(prev, meta.ts);
    }

    // Notify subscribers of change
    this.notify();
  }

  async requestPupChanges(
    pupId: string,
    newData: Record<string, unknown>,
    callbacks: ActionCallbacks,
  ): Promise<boolean> {
    if (!pupId || !newData || !callbacks) {
      console.warn(
        "Error. requestPupChanges expected pupId, newData, callbacks",
        { pupId, newData, callbacks },
      );
    }

    const actionType = "UPDATE-PUP";

    // Make a network call
    const res = await postConfig(pupId, newData).catch((err) => {
      console.error(err);
    });

    if (!res || res.error) {
      callbacks.onError({
        error: true,
        message: "failure occured when calling postConfig",
      });
      return false;
    }

    // Submitting changes succeeded, carry on.
    const txn = res.id;
    if (txn && callbacks) {
      // Register transaction in actions register.
      this.registerAction(txn, callbacks, actionType, pupId);
    }

    // Return truthy to caller
    return true;
  }

  async requestPupAction(
    pupId: string,
    action: string,
    callbacks: ActionCallbacks,
    body?: unknown,
  ): Promise<boolean> {
    if (!pupId || !action || !callbacks) {
      console.warn(
        "Error. requestPupAction expected pupId, action, callbacks",
        { pupId, action, callbacks },
      );
    }

    const actionType = "PUP-ACTION";
    const timeoutMs = 45000; // 45 seconds

    // Make a network call
    const res = await pickAndPerformPupAction(pupId, action, body).catch(
      (err) => {
        console.error(err);
      },
    );

    if (!res || res.error) {
      callbacks.onError({
        error: true,
        message: "failure occured when calling postConfig",
      });
      return false;
    }

    // Submitting changes succeeded, carry on.
    const txn = res.id;
    if (txn && callbacks) {
      // Register transaction in actions register.
      this.registerAction(txn, callbacks, actionType, pupId, timeoutMs, action);
    }

    // Return truthy to caller
    return true;
  }

  transactionTimeoutChecker(): void {
    setInterval(() => {
      if (this.actions.length === 0) return;
      this.actions.forEach((a) => {
        if (!a.expireAt) return;

        if (
          Date.now() > a.expireAt &&
          typeof a.callbacks.onTimeout === "function"
        ) {
          try {
            const registeredActionIndex = this.actions.findIndex(
              (b) => b.txn === a.txn,
            );
            this.actions.splice(registeredActionIndex, 1);
            a.callbacks.onTimeout();
          } catch (err) {
            console.warn(
              "registered onTimeout fn for txn threw an error when called",
            );
          }
        }
      });
    }, 1000);
  }

  getInstalledPupsForSource(sourceId: string): EnrichedPup[] {
    return this.pups.filter((p) => p.state?.source?.id === sourceId);
  }

  getActionsForPup(pupId: string): RegisteredAction[] {
    return this.actions.filter((a) => a.pupId === pupId);
  }

  getJobsForPup(pupId: string): JobRecord[] {
    // Get active jobs for this pup (enable/disable/install/etc)
    const jobs = store?.jobsContext?.jobs || [];
    const activeJobs = jobs.filter(
      (j) => j.pupID === pupId && isActiveJobStatus(j.status),
    );
    return activeJobs;
  }

  getRecentJobForPup(pupId: string): JobRecord | null {
    // Get the most recent job for this pup.
    const jobs = store?.jobsContext?.jobs || [];
    const relevantJobs = jobs.filter((j) => j.pupID === pupId);

    if (relevantJobs.length === 0) return null;

    // Sort by finished time (for terminal jobs) or started time (for active jobs), most recent first.
    const sorted = relevantJobs.sort((a, b) => {
      const timeA = new Date(a.finished || a.started).getTime();
      const timeB = new Date(b.finished || b.started).getTime();
      return timeB - timeA;
    });


    //Only show logs for jobs that are queued or in progress.
    const mostRecent = sorted[0];
    const isActive = isActiveJobStatus(mostRecent.status);
    if (isActive) {
      return mostRecent;
    }

    // Keep terminal jobs visible briefly so users can see final log lines.
    const now = Date.now();
    const recentJobCutoff = now - (15 * 1000);
    const jobTime = new Date(mostRecent.finished || mostRecent.started).getTime();
    if (jobTime > recentJobCutoff) {
      return mostRecent;
    }

    return null;
  }

  recomputeAllDerivedValues(): void {
    // Re-derive computed values for all pups (called when jobs are loaded after page refresh)
    for (const pup of this.pups) {
      if (pup.state) {
        pup.computed = this.determineCalculatedVals(pup);
      }
    }
    this.notify(null, { type: "jobs-loaded" });
  }

  getSourceList(): SourceListItem[] {
    if (!pkgController.sourcesIndex) {
      return [];
    }

    return Object.entries(pkgController.sourcesIndex).map(([sourceId, sourceData]) => {

      const installedPupsForSource = pkgController.getInstalledPupsForSource(sourceId);
      const installedCount = installedPupsForSource.length;

      return {
        sourceId: sourceId,
        location: sourceData.location || "",
        name: sourceData.name || "",
        pupCount: Object.keys(sourceData.pups || {}).length,
        installedCount,
        error: sourceData.error || null,
      };
    });
  }

  ingestProgressUpdate(data: Change<"progress", ActionProgress>): void {
    // Two types of updates:
    // those with a PupID (obviously relating to that Pup
    // those without (related to system)

    /* SAMPLE {
      "id": "26db9ffa272e796826d156e593f1f930",
      "error": "",
      "type": "progress",
      "update": {
        "actionID": "26db9ffa272e796826d156e593f1f930",
        "PupID": "208f8f19ebcc479cb0a9f1e5d12bda2d", <-- Not present for System updates.
        "progress": 0,
        "step": "enable",
        "msg": "[patch-a37bafc7f518] Applied all patch operations, rebuilding..",
        "error": false,
        "step_taken": 8015165
      }
    }*/

    const update = data?.update as ProgressUpdate | undefined;
    // Backend is inconsistent in its use of pupID vs PupID vs pupId, and
    // system actions marshal pupID as an empty string, so treat any falsy id
    // as a system update.
    const id =
      update?.pupID ||
      update?.PupID ||
      update?.pupId ||
      "system";

    if (this.activityIndex[id]) {
      // Prior acitivity exists for id, add more.
      this.activityIndex[id].push(data.update);
    } else {
      // First activity for id, creates activity array.
      this.activityIndex[id] = [];
      this.activityIndex[id].push(data.update);
    }
    // Notify observers with an 'activity' type
    const activityType = id === "system" ? "system-activity" : "activity";
    // Notify only the relevant pup page when possible to avoid cross-pup flicker.
    this.notify(id === "system" ? null : id, { type: activityType });
  }
}

export type { PkgController };

// Instance holder
let instance: PkgController | undefined;

function getInstance(): PkgController {
  if (!instance) {
    instance = new PkgController();
  }
  return instance;
}

export const pkgController = getInstance();

function isValidState(pupState: PupState | null | undefined): boolean {
  // TODO. PupState validity check
  return !!(pupState && pupState.manifest);
}

function determineInstallationId(state: PupState | null): StatusDescriptor {
  const installation = state?.installation;

  if (!installation) {
    return { id: "not_installed", label: "not installed" };
  }

  if (installation === "installing") {
    return { id: "installing", label: "installing" };
  }

  if (installation === "upgrading") {
    return { id: "upgrading", label: "updating" };
  }

  if (installation === "ready" || installation === "unready") {
    return { id: installation, label: "installed" };
  }

  if (installation === "broken") {
    return { id: "broken", label: "broken" };
  }

  if (installation === "uninstalling") {
    return { id: "uninstalling", label: "uninstalling" };
  }

  if (installation === "uninstalled") {
    return { id: "uninstalled", label: "uninstalled" };
  }

  if (installation === "purging") {
    return { id: "purging", label: "cleaning" };
  }

  return { id: "unknown", label: "unknown" };
}

function determineStatusId(
  state: PupState | null,
  stats: PupStats | null | undefined,
  activeActions: RegisteredAction[] = [],
  activeJobs: JobRecord[] = [],
): StatusDescriptor {
  const installation = state?.installation;
  const status = stats?.status;
  const flags = {
    needs_deps: state?.needsDeps,
    needs_config: state?.needsConf,
  };

  if (installation === "installing") {
    return { id: "installing", label: "Installing" };
  }

  if (installation === "upgrading") {
    return { id: "upgrading", label: "Updating" };
  }

  if (installation === "purging") {
    return { id: "purging", label: "Cleaning" };
  }

  if (installation === "uninstalling") {
    return { id: "uninstalling", label: "Uninstalling" };
  }

  if (installation === "uninstalled") {
    return { id: "uninstalled", label: "Uninstalled" };
  }

  if (flags.needs_deps) {
    return { id: "needs_deps", label: "Unmet Dependencies" };
  }

  if (flags.needs_config) {
    return { id: "needs_config", label: "Needs Config" };
  }

  // Check for active enable/disable/rollback actions (from pkgController.actions)
  const hasActiveDisableAction = activeActions.some((a) => a.action === "disable");
  const hasActiveEnableAction = activeActions.some((a) => a.action === "enable");

  // Check for active enable/disable/rollback jobs (from jobsContext, survives refresh)
  const hasActiveDisableJob = activeJobs.some((j) =>
    j.action === "disable" || j.displayName?.toLowerCase().includes("disabl"),
  );
  const hasActiveEnableJob = activeJobs.some((j) =>
    j.action === "enable" || j.displayName?.toLowerCase().includes("enabl"),
  );
  const hasActiveRollbackJob = activeJobs.some((j) =>
    j.action === "rollback" || j.displayName?.toLowerCase().includes("rollback"),
  );

  const hasActiveDisable = hasActiveDisableAction || hasActiveDisableJob;
  const hasActiveEnable = hasActiveEnableAction || hasActiveEnableJob;

  // If rollback is active, show "Rolling back" status
  if (hasActiveRollbackJob) {
    return { id: "rollback", label: "Rolling back" };
  }

  // If disable is active and status shows stopped, show "stopping" until job completes
  if (hasActiveDisable && (status === "stopped" || status === "stopping")) {
    return { id: "stopping", label: "stopping" };
  }

  // If enable is active and status shows stopped, show "starting" until job completes
  if (hasActiveEnable && (status === "stopped" || status === "starting")) {
    return { id: "starting", label: "starting" };
  }

  if (status === "starting") {
    return { id: "starting", label: "starting" };
  }

  if (status === "running") {
    return { id: "running", label: "running" };
  }

  if (status === "stopping") {
    return { id: "stopping", label: "stopping" };
  }

  if (status === "stopped") {
    return { id: "stopped", label: "stopped" };
  }

  return { id: "unknown", label: "unknown" };
}
