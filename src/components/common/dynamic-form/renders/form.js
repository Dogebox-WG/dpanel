import { html, nothing, repeat, classMap } from "/vendor/@lit/all@3.1.2/lit-all.min.js";
import { generateActionLabel } from "./action.js";

export function _generateOneOrManyForms(data) {
  const tabs = data.sections.map((section, index) => {
    const changeCount = this[`_form_${section.name}_count`];
    return html`
      <sl-tab
        @click=${(event) => this._handleTabChange(event, section.name)}
        slot="nav"
        ?disabled=${this._loading}
        class="capitalize"
        panel="${section.name}"
      >
        ${section.name}
        <sl-tag
          pill
          size="small"
          ?data-active=${changeCount}
          class="tag-change-indicator"
          variant="neutral"
          >${changeCount}
        </sl-tag>
      </sl-tab>
    `;
  });

  const form = (section, index = 0) => {
    const formFields = repeat(
      section.fields,
      (field) => field.name,
      (field) => this._generateField(field),
    );
    const formControls = this._generateFormControls({
      formId: section.name,
      submitLabel: section.submitLabel || "Save",
      submitLabelSuccess: section.submitLabelSuccess || ""
    });
    return html`
      <form
        id=${section.name}
        @submit=${this._handleSubmit}
        ?data-mark-modified=${this.markModifiedFields}
      >
        ${formFields} ${formControls}
      </form>
    `;
  };

  const panels = data.sections.map((section, index) => {
    return html`
      <sl-tab-panel name=${section.name}>
        ${form(section, index)}
      </sl-tab-panel>
    `;
  });

  // if mutliple sections, render tabs and panels
  if (data.sections.length > 1)
    return html`
      <sl-tab-group
        placement=${this._orientation === "portrait" ? "top" : "start"}
      >
        ${tabs} ${panels}
      </sl-tab-group>
    `;

  if (data.sections.length === 1) {
    return html` ${form(data.sections[0])} `;
  }
}

export function _generateField(field) {
  try {
    // Hidden fields, never render HTML
    if (field.hidden) return nothing;

    // Fields with reveal rules render HTML if rule conditions are met
    if (field.revealOn && !this[this.propKeys(field.name).revealKey]) return nothing;

    // Stlyistic
    const formControlClasses = classMap({
      'form-control': true,
      'breakline': field.breakline
    });

    // Form Label
    const actionEl = field.labelAction ? generateActionLabel(
      this,
      field.name,
      field.labelAction.name,
      field.labelAction.label
    ) : nothing;

    const labelEl = field.label ? html`
      <span slot="label">
        ${field.label}
        ${actionEl}
      </span>
    ` : nothing;

    const fieldElement = this[`_render_${field.type}`](field, { labelEl });

    return html`
      <div class=${formControlClasses}>
        ${fieldElement}
      </div>
    `;
  } catch (fieldRenderError) {
    console.error("Dynamic form field error:", { field, fieldRenderError });
    return this._generateErrorField(field);
  }
}

export function _generateErrorField(field) {
  return html`
    <div class="form-control render-error" no-collect>
      <sl-input
        label="Field Error"
        help-text="${field.type} is not a valid field type"
        value=${field.type}
      >
        <sl-icon name="exclamation-diamond" slot="prefix"></sl-icon>
      </sl-input>
    </div>
  `;
}

export function _generateFormControls(options = {}) {
  const changeCount = this[`_form_${options.formId}_count`];
  return html`
    <div class="footer-controls">
      ${this.allowDiscardChanges && changeCount
        ? html`
            <sl-button
              variant="text"
              id="${options.formId}__reset_button"
              @click=${this._handleDiscardChanges}
              class=${this.theme}
            >
              Discard changes
            </sl-button>
          `
        : nothing}

      <sl-button
        id="${options.formId}__save_button"
        variant="primary"
        type="submit"
        class=${this.theme}
        ?loading=${this._loading}
        ?disabled=${!changeCount || this._celebrate}
        form=${options.formId}
      >
        ${this._celebrate ? html`
          <sl-icon name="check-lg" slot=${options.submitLabelSuccess ? "prefix" : ""}></sl-icon>
          ${options.submitLabelSuccess}
          ` : (options.submitLabel || "Save")}
      </sl-button>
    </div>
  `;
}
