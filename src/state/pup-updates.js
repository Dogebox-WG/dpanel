// Bridge module: the implementation now lives in pup-updates.impl.ts.
// Existing imports of /state/pup-updates.js keep working until the Phase 4
// cleanup renames the .impl modules to their canonical names.
export { pupUpdates } from "./pup-updates.impl.ts";
