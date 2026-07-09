// ReactiveClass.ts
import type { ReactiveController } from "lit";

/**
 * Controllers attached to a ReactiveClass host may also expose an
 * updateComplete promise, mirroring Lit's ReactiveElement.
 */
export interface ReactiveClassController extends ReactiveController {
  updateComplete?: Promise<boolean>;
}

export class ReactiveClass {
  controllers: Set<ReactiveClassController>;

  constructor() {
    this.controllers = new Set();
  }

  addController(controller: ReactiveClassController) {
    this.controllers.add(controller);
    controller.hostConnected?.();
  }

  removeController(controller: ReactiveClassController) {
    this.controllers.delete(controller);
  }

  requestUpdate() {
    this.controllers.forEach((controller) => {
      controller.hostUpdate?.();
    });
  }

  get updateComplete(): Promise<boolean> {
    const promises: Promise<boolean>[] = [];
    this.controllers.forEach((controller) => {
      if (controller.updateComplete instanceof Promise) {
        promises.push(controller.updateComplete);
      }
    });
    return Promise.all(promises).then(() => true);
  }
}
