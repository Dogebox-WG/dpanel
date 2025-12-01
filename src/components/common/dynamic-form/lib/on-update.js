import { customElementsReady } from '/utils/custom-elements-ready.js';

export async function _onUpdate(changedProperties) {
  if (changedProperties.has("fields") || changedProperties.has("values")) {
    // Run rules.
    this._checkForChanges();
  }

  if (!this._shouldUpdateForm(changedProperties)) {
    return;
  }
  // Determine the appropriate form to target


  const form = this._getTargetForm(changedProperties);
  if (!form) {
    return;
  }

  // Update the active form ID if necessary
  this._updateActiveFormId(form, changedProperties);

  // Ensure all custom elements within the form are fully defined
  await customElementsReady(form);
}

export function _shouldUpdateForm(changedProperties) {
  return changedProperties.has('fields') || changedProperties.has('_activeFormId');
}

export function _getTargetForm(changedProperties) {
    const isDataInitialization =
      changedProperties.has('fields') &&
      (!changedProperties.has('_activeFormId') || !this._activeFormId);

    const formSelector = isDataInitialization
      ? 'form'
      : `form#${CSS.escape(this._activeFormId)}`;

  return this.shadowRoot.querySelector(formSelector);
}

export function _updateActiveFormId(form, changedProperties) {
  const isDataInitialization = changedProperties.has('fields') &&
      (!changedProperties.has('_activeFormId') || !this._activeFormId);

  if (isDataInitialization) {
      this._activeFormId = form.id;
  }
}