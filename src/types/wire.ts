import type { Message } from "@bufbuild/protobuf";

/**
 * Deeply converts a protoc-gen-es message type into its plain JSON wire
 * shape.
 *
 * dogeboxd still serialises most payloads with Go's encoding/json rather
 * than protojson, so runtime objects are plain JSON: they carry no proto
 * Message metadata ($typeName/$unknown) and int64 fields arrive as plain
 * numbers rather than bigints. Individual field-level divergences (enum
 * strings, timestamps, key casing) are handled per-type in the adapter
 * modules alongside this file; see dogeboxd protocol/Readme.md for the
 * full divergence table.
 */
export type Wire<T> = T extends bigint
  ? number
  : T extends (infer U)[]
    ? Wire<U>[]
    : T extends Message
      ? { [K in keyof Omit<T, "$typeName" | "$unknown">]: Wire<T[K]> }
      : T extends object
        ? { [K in keyof T]: Wire<T[K]> }
        : T;
