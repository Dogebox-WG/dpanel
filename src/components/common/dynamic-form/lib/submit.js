import { getFormControls } from '/vendor/@shoelace/cdn@2.14.0/utilities/form.js';

// Validates all form controls and displays validation errors to the user.
export function checkValidity(form) {
  if (!form) {
    throw new Error('dynamic-form checkValidity called without providing form Node')
  }
  const formControls = getFormControls(form);
  return [...formControls].every(control => control.reportValidity());
}

export function getChanges(form) {
  if (!form) {
    throw new Error('dynamic-form getChanges called without providing form Node')
  }

  const modifiedFieldNodes = form.querySelectorAll('[data-dirty-field]:not([data-repeat-field])');

  // Collect data
  let formData = {};
  Array
    .from(modifiedFieldNodes)
    .map(node => node.name)
    .forEach((fieldName) => {
      const { currentKey } = this.propKeys(fieldName);
      formData[fieldName] = this[currentKey]
    });

  return formData;
}

export async function _handleSubmit(event) {
  event.preventDefault();
  const isValid = this.checkValidity(event.currentTarget);
  const stagedChanges = this.getChanges(event.currentTarget);

  if (!isValid) {
    // Form has validation issues - checkValidity will show errors to user.
    return
  }

  this._loading = true;
  const res = await this.onSubmit(stagedChanges, event.currentTarget, this);

  if (!res || res.error) {
    // console.warn('Error submitting changes, changes not saved.', { res });
  }

  // If requireCommit is true, commitChanges must be called separately
  if (!this.requireCommit) {
    this.commitChanges(event.currentTarget);
    this._loading = false;
  }
}

export function commitChanges(form) {
  if (!form) {
    throw new Error('dynamic-form commitChanges called without providing form Node')
  }

  // Get changes.
  const stagedChanges = this.getChanges(form);

  // Sync the prefixed properties
  Object.keys(stagedChanges).forEach((fieldName) => {
    const { currentKey, originalKey } = this.propKeys(fieldName);
    this[originalKey] = this[currentKey];
  });

  // Reset dirty flags on fields
  this._checkForChanges();

  // Dispatch a form success event.
  this.dispatchEvent(new CustomEvent('form-submit-success', {
    detail: {},
    composed: true,
    bubbles: true
  }));

  this._loading = false;
}

export function retainChanges() {
  this._loading = false;
}
