// Bridge module: the implementation now lives in main-channel.impl.ts.
// Existing imports of /controllers/sockets/main-channel.js keep working
// until the Phase 4 cleanup renames the .impl modules to their canonical
// names.
export { mainChannel } from "./main-channel.impl.ts";
