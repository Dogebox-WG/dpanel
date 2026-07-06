// Bridge module: the implementation now lives in store.impl.ts. Existing
// imports of /state/store.js keep working until the Phase 4 cleanup renames
// the .impl modules to their canonical names.
export { store } from "./store.impl";
