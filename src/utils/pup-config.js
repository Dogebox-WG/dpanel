// Supported config field types for pup manifests.
// These map directly to _render_<type> functions in the dynamic-form component.
const SUPPORTED_TYPES = new Set([
  "text", "password", "number", "toggle", "email", "textarea", "select", "checkbox", "radio", "date", "range", "color"
]);

const TRUE_VALUES = new Set(["true", "1", "yes", "on"]);

export function buildPupConfig(manifestConfig, storedValues = {}) {
  if (!manifestConfig || !Array.isArray(manifestConfig.sections)) {
    return null;
  }

  const sections = [];
  const values = {};

  manifestConfig.sections.forEach((section) => {
    const sectionFields = [];
    (section.fields || []).forEach((field) => {
      if (!SUPPORTED_TYPES.has(field.type)) {
        return;
      }

      const dynamicField = {
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

function normalizeFieldValue(field, storedValue) {
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
    case "range":
      if (value === undefined || value === null || value === "") {
        return "";
      }

      if (typeof value === "number") {
        return Number.isFinite(value) ? String(value) : "";
      }

      const parsed = Number(value);
      return Number.isFinite(parsed) ? String(parsed) : "";

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


