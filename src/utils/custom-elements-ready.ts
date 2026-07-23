export async function customElementsReady(containerElement: Element) {
  if (!(containerElement instanceof Element)) {
    throw new Error("The argument must be a DOM element.");
  }

  // Get all element names within the containerElement (ie, the <form>)
  const elementNames = Array.from(containerElement.querySelectorAll("*"))
    .map((el) => el.localName)
    .filter((value, index, self) => self.indexOf(value) === index)
    .filter((name) => name.includes("-"));

  // Create an array of promises for undefined custom elements
  const customElementsPromises = elementNames
    .map((name) => customElements.whenDefined(name));

  // Wait for all custom elements to be defined
  await Promise.allSettled(customElementsPromises);
}
