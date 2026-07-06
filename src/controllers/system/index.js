// Bridge module: the implementation now lives in index.impl.ts. Existing
// imports of /controllers/system/index.js keep working until the Phase 4
// cleanup renames the .impl modules to their canonical names.
export { sysController } from "./index.impl.ts";
