export function _checkForChanges() {
  if (!this.fields?.sections) return;
  let dirty = 0;

  // Firstly, check if any field differs from prior state.
  this.fields.sections.forEach((section) => {
    let flattenedFields = [];
    let sectionChangeCount = 0;

    section.fields.forEach((field) => {
      flattenedFields.push(field)
      if (field.type === 'toggleField') {
        field.fields.forEach((f) => {
          flattenedFields.push(f);
        })
      }
    });

    flattenedFields.forEach((field) => {
      if (this._checkAndSetFieldDirtyStatus(field.name)) {
        sectionChangeCount++;
        dirty++;
      }
    });

    this[`_form_${section.name}_count`] = sectionChangeCount;
  });

  this._dirty = dirty;

  // [HACK] Process rules on next tick
  // Secondly, test whether any rule targeted fields have condition changes.
  setTimeout(() => {
    const currentState = this.getState();
    const currentValues = this.getFormValues();
    this._rules.forEach((rule) => {
      this._checkAndSetConditionMetFlags(rule, currentState, currentValues);
    });
  }, 1);
}

export function _checkAndSetConditionMetFlags(rule, currentState, currentValues) {
  const revealKey = this.propKeys(rule.self).revealKey;

  if (!rule.fn) {

    // Obtain targets current value
    const targetValue = this[this.propKeys(rule.target).currentKey]
    const desiredValue = rule.value;

    // Test the rule
    let newState;
    switch (rule.operator) {
      case "=":
        newState = targetValue == desiredValue
        break;
      case "!=":
        newState = targetValue && targetValue != desiredValue
        break
    }

    // Toggle field flag (and being a reactive property, the UI will update);
    this[revealKey] = newState;
  }

  if (rule.fn) {
    const shouldReveal = !!rule.fn(currentState, currentValues);
    this[revealKey] = shouldReveal
  }
}

export function _checkAndSetFieldDirtyStatus(fieldName) {
  const { currentKey, originalKey, isDirtyKey } = this.propKeys(fieldName);

  // Replace undefined with an empty string for comparison
  // to handle the situation where a user has backspaced an input to "".
  const curr = this[currentKey] ?? "";
  const orig = this[originalKey] ?? "";
  const isDirty = curr !== orig;

  // Update the isDirty flag and return its value
  this[isDirtyKey] = isDirty;
  return isDirty;
}