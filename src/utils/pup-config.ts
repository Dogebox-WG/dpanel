import type {
  PupManifestConfigField,
  PupManifestConfigFields,
  PupManifestConfigFieldType,
} from "/types/manifest";

// Supported config field types for pup manifests.
// These map directly to field renderers in the deform `<de-form>` component.
const SUPPORTED_TYPES = new Set<PupManifestConfigFieldType>([
  "text", "password", "number", "toggle", "email", "textarea", "select", "checkbox", "radio", "date", "range", "color",
]);

const TRUE_VALUES = new Set(["true", "1", "yes", "on"]);

/** A field descriptor consumed by the deform `<de-form>` renderer. */
export interface DeformField {
  type: PupManifestConfigFieldType;
  label: string;
  name: string;
  required: boolean;
  placeholder?: string;
  help?: string;
  helpText?: string;
  min?: number;
  max?: number;
  step?: number;
}

export interface DeformSection {
  name: string;
  label: string;
  fields: DeformField[];
}

export interface PupConfig {
  fields: { sections: DeformSection[] };
  values: Record<string, string | boolean>;
}

export function buildPupConfig(
  manifestConfig: PupManifestConfigFields | null | undefined,
  storedValues: Record<string, unknown> = {},
): PupConfig | null {
  if (!manifestConfig || !Array.isArray(manifestConfig.sections)) {
    return null;
  }

  const sections: DeformSection[] = [];
  const values: Record<string, string | boolean> = {};

  manifestConfig.sections.forEach((section) => {
    const sectionFields: DeformField[] = [];
    (section.fields || []).forEach((field) => {
      if (!SUPPORTED_TYPES.has(field.type)) {
        return;
      }

      const dynamicField: DeformField = {
        type: field.type,
        label: field.label || field.name,
        name: field.name,
        required: Boolean(field.required),
      };

      if (field.placeholder) {
        dynamicField.placeholder = field.placeholder;
      }

      if (field.help) {
        dynamicField.help = field.help;
        dynamicField.helpText = field.help;
      }

      if (field.type === "number") {
        if (field.min !== undefined) dynamicField.min = field.min;
        if (field.max !== undefined) dynamicField.max = field.max;
        if (field.step !== undefined) dynamicField.step = field.step;
      }

      sectionFields.push(dynamicField);
      values[field.name] = normalizeFieldValue(field, storedValues[field.name]);
    });

    if (sectionFields.length > 0) {
      sections.push({
        name: section.name,
        label: section.label || section.name,
        fields: sectionFields,
      });
    }
  });

  if (sections.length === 0) {
    return null;
  }

  return {
    fields: { sections },
    values,
  };
}

function normalizeFieldValue(
  field: PupManifestConfigField,
  storedValue: unknown,
) {
  const value = storedValue ?? field.default;

  switch (field.type) {
    case "toggle":
    case "checkbox":
      if (typeof value === "boolean") {
        return value;
      }
      if (typeof value === "string") {
        return TRUE_VALUES.has(value.trim().toLowerCase());
      }
      return Boolean(value);

    case "number":
    case "range": {
      if (value === undefined || value === null || value === "") {
        return "";
      }

      if (typeof value === "number") {
        return Number.isFinite(value) ? String(value) : "";
      }

      const parsed = Number(value);
      return Number.isFinite(parsed) ? String(parsed) : "";
    }

    case "text":
    case "password":
    case "email":
    case "textarea":
    case "date":
    case "color":
    case "select":
    case "radio":
    default:
      if (value === undefined || value === null) {
        return "";
      }
      return String(value);
  }
}
