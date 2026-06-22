export function focus(fieldName) {
  if (!fieldName) return
  const node = this.shadowRoot.querySelector(`[name="${fieldName}"]`)

  if (!node) {
    console.warn(`field focus issue: ${fieldName} not found`)
    return
  }

  if (!node || !node.focus || typeof node.focus !== 'function') {
    console.warn(`field focus issue: focus method does not exist for ${fieldName}`);
    return
  }

  node.focus();
}