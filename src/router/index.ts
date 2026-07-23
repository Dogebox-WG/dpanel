import type { Router } from "./router.js";

let routerInstance: Router | null = null;

export function setRouterInstance(router: Router) {
  routerInstance = router;
}

export function getRouter(): Router | null {
  return routerInstance;
}
