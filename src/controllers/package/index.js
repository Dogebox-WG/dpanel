// Bridge module: the implementation now lives in index.impl.ts. Existing
// imports of /controllers/package/index.js keep working until the Phase 4
// cleanup renames the .impl modules to their canonical names.
export { pkgController } from "./index.impl.ts";
