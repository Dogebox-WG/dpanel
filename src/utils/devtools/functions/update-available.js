import { sysController } from "/controllers/system/index.js";
import { store } from "/state/store.js";

export function emitSyntheticUpdateAvailable() {
  const hasUpdateEvent = {
    type: 'system-update-available',
    update: true
  }
  
  sysController.ingestSystemUpdateAvailableEvent(hasUpdateEvent)
}