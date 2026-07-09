export const bindToClass = function (
  mapOfFunctions: Record<string, unknown>,
  that: object,
) {
  Object.keys(mapOfFunctions).forEach((key) => {
    const fn = mapOfFunctions[key];
    if (typeof fn === "function") {
      Reflect.set(that, key, fn.bind(that));
    }
  });
};
