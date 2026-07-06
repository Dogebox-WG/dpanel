// Bridge module: the implementation now lives in job-channel.impl.ts.
// Existing imports of /controllers/sockets/job-channel.js keep working until
// the Phase 4 cleanup renames the .impl modules to their canonical names.
export { jobWebSocket } from "./job-channel.impl.ts";
