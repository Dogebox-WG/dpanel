// Bridge module: the implementation now lives in index.impl.ts. Existing
// imports of /controllers/jobs/index.js keep working until the Phase 4
// cleanup renames the .impl modules to their canonical names.
export { jobsController } from "./index.impl.ts";
