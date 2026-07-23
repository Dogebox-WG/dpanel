import type {
  PupInterfaceVersion as ProtoPupInterfaceVersion,
  PupUpdateInfo as ProtoPupUpdateInfo,
  PupUpdatesCheckedEvent as ProtoPupUpdatesCheckedEvent,
  PupVersion as ProtoPupVersion,
} from "/gen/dogebox/v1/types_pb";
import type { Wire } from "./wire";

export type PupInterfaceChangeType = "major" | "minor" | "patch";

export type PupInterfaceVersion = Omit<
  Wire<ProtoPupInterfaceVersion>,
  "changeType"
> & {
  changeType: PupInterfaceChangeType;
};

export type PupVersion = Omit<
  Wire<ProtoPupVersion>,
  "releaseNotes" | "releaseDate" | "releaseUrl" | "breakingChanges" | "interfaceChanges"
> & {
  // omitempty on the Go side.
  releaseNotes?: string;
  // Go time.Time marshals to an RFC3339 string, not a proto Timestamp.
  releaseDate?: string;
  releaseUrl?: string;
  breakingChanges?: string[];
  interfaceChanges?: PupInterfaceVersion[];
};

export type PupUpdateInfo = Omit<
  Wire<ProtoPupUpdateInfo>,
  "availableVersions" | "lastChecked"
> & {
  availableVersions: PupVersion[];
  // Go time.Time marshals to an RFC3339 string, not a proto Timestamp.
  lastChecked: string;
};

export type PupUpdatesCheckedEvent = Wire<ProtoPupUpdatesCheckedEvent>;
