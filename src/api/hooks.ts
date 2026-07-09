/**
 * A response hook entry: a single-key object mapping the hook name to a
 * function that adjusts the response payload (dev tool).
 */
export type ResponseHook = Record<string, (data: unknown) => unknown>;

class HookManager {
  static instance: HookManager | undefined;

  hooks!: Map<string, boolean>; // stores enabled/disabled state of hooks

  constructor() {
    if (HookManager.instance) {
      return HookManager.instance;
    }
    this.hooks = new Map();
    HookManager.instance = this;
  }

  enable(hookName: string) {
    this.hooks.set(hookName, true);
  }

  disable(hookName: string) {
    this.hooks.set(hookName, false);
  }

  set(hookName: string, enabled: boolean) {
    this.hooks.set(hookName, enabled);
  }

  process(hooks: ResponseHook[], data: unknown): unknown {
    let adjustedData = data;

    for (const hook of hooks) {
      const [[hookName, hookFn]] = Object.entries(hook);

      if (this.hooks.get(hookName) === true) {
        try {
          console.debug("Hook modified response before delivery: ", hookName, { original_data: JSON.parse(JSON.stringify(data)), modified_data: adjustedData });
          adjustedData = Object.assign({}, adjustedData, hookFn(adjustedData));
        } catch (err) {
          console.warn(`Hook ${hookName} failed:`, err);
        }
      }
    }

    return adjustedData;
  }

  clear() {
    this.hooks.clear();
  }
}

export const hookManager = new HookManager();
