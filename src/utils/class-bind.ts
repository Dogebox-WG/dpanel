export const bindToClass = function (
  mapOfFunctions: Record<string, unknown>,
  that: object,
): void {
  Object.keys(mapOfFunctions).forEach((key) => {
    const fn = mapOfFunctions[key];
    if (typeof fn === "function") {
      (that as Record<string, unknown>)[key] = fn.bind(that);
    }
  });
};
