import type {
  PupManifest as ProtoPupManifest,
  PupManifestBuild as ProtoPupManifestBuild,
  PupManifestCommand as ProtoPupManifestCommand,
  PupManifestConfigField as ProtoPupManifestConfigField,
  PupManifestConfigFields as ProtoPupManifestConfigFields,
  PupManifestConfigSection as ProtoPupManifestConfigSection,
  PupManifestContainer as ProtoPupManifestContainer,
  PupManifestDependency as ProtoPupManifestDependency,
  PupManifestDependencySource as ProtoPupManifestDependencySource,
  PupManifestExposeConfig as ProtoPupManifestExposeConfig,
  PupManifestInterface as ProtoPupManifestInterface,
  PupManifestMeta as ProtoPupManifestMeta,
  PupManifestMetric as ProtoPupManifestMetric,
  PupManifestPermissionGroup as ProtoPupManifestPermissionGroup,
  PupManifestService as ProtoPupManifestService,
} from "/gen/dogebox/v1/types_pb";
import type { Wire } from "./wire";

/** Config field types accepted by dogeboxd's PupManifest.Validate(). */
export type PupManifestConfigFieldType =
  | "text"
  | "password"
  | "number"
  | "toggle"
  | "email"
  | "textarea"
  | "select"
  | "checkbox"
  | "radio"
  | "date"
  | "range"
  | "color";

export type PupManifestMeta = Wire<ProtoPupManifestMeta>;
export type PupManifestBuild = Wire<ProtoPupManifestBuild>;
export type PupManifestCommand = Wire<ProtoPupManifestCommand>;
export type PupManifestExposeConfig = Wire<ProtoPupManifestExposeConfig>;
export type PupManifestPermissionGroup = Wire<ProtoPupManifestPermissionGroup>;
export type PupManifestDependencySource = Wire<ProtoPupManifestDependencySource>;
export type PupManifestMetric = Wire<ProtoPupManifestMetric>;

export type PupManifestService = Omit<Wire<ProtoPupManifestService>, "command"> & {
  // Go always marshals nested structs; proto3 message fields generate optional.
  command: PupManifestCommand;
};

export type PupManifestInterface = Omit<
  Wire<ProtoPupManifestInterface>,
  "permissionGroups"
> & {
  permissionGroups: PupManifestPermissionGroup[];
};

export type PupManifestDependency = Omit<Wire<ProtoPupManifestDependency>, "source"> & {
  source: PupManifestDependencySource;
};

export type PupManifestConfigField = Omit<
  Wire<ProtoPupManifestConfigField>,
  "type" | "defaultValue"
> & {
  type: PupManifestConfigFieldType;
  // Wire key is `default` (Go json tag); proto reserves the keyword so the
  // generated field is named defaultValue.
  default?: unknown;
};

export type PupManifestConfigSection = Omit<
  Wire<ProtoPupManifestConfigSection>,
  "fields"
> & {
  fields: PupManifestConfigField[];
};

export type PupManifestConfigFields = Omit<
  Wire<ProtoPupManifestConfigFields>,
  "sections"
> & {
  sections: PupManifestConfigSection[];
};

export type PupManifestContainer = Omit<
  Wire<ProtoPupManifestContainer>,
  "build" | "services" | "exposes"
> & {
  build: PupManifestBuild;
  services: PupManifestService[];
  exposes: PupManifestExposeConfig[];
};

export type PupManifest = Omit<
  Wire<ProtoPupManifest>,
  "meta" | "config" | "container" | "interfaces" | "dependencies" | "metrics"
> & {
  meta: PupManifestMeta;
  config: PupManifestConfigFields;
  container: PupManifestContainer;
  interfaces: PupManifestInterface[];
  dependencies: PupManifestDependency[];
  metrics: PupManifestMetric[];
};
