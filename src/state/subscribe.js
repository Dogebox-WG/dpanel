// Bridge module: the implementation now lives in subscribe.impl.ts. Existing
// imports of /state/subscribe.js keep working until the Phase 4 cleanup
// renames the .impl modules to their canonical names.
export { StoreSubscriber } from "./subscribe.impl";
