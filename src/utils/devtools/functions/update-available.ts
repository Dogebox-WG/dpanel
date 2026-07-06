import { sysController } from "/controllers/system/index.js";

export function emitSyntheticUpdateAvailable(): void {
  // The 'system-update-available' event carries no payload the client cares
  // about; receiving it is enough to toggle the update indicators.
  sysController.ingestSystemUpdateAvailableEvent();
}
