// import { getManifest } from "/api/manifest/index.js";
import { store } from "/state/store.js";
import { pkgController } from "/controllers/package/index.js";
import { getBootstrapV2 } from "/api/bootstrap/bootstrap.js";
import { getStoreListing } from "/api/sources/sources.js";
import type { RouteContext, RouteCommands } from "./router.js";

export async function loadPup(context: RouteContext, commands: RouteCommands) {
  const pupId = context.params.pupid;
  const sourceId = context.params.sourceid;
  const pupName = decodeURIComponent(context.params.pupname);

  // Bad params.
  // Must have one of pupId OR (sourceId AND pupName)
  if (!pupId && (!sourceId || !pupName)) {
    store.updateState({
      pupContext: { ready: true, result: 400 },
    });
    return;
  }

  // What type of lookup to perform?
  const lookupType = !!pupId ? "byStatePupId" : "byDefSourceIdAndPupName";

  // What type of bootstrapping to perform?
  const isStoreListingPage = !!context.route.path.startsWith(
    "/explore/:sourceid/:pupname",
  );

  try {
    // Attempt to get the pup from memory
    let pup = pkgController.getPupMaster({
      pupId,
      sourceId,
      pupName,
      lookupType,
    }).pup;

    if (!pup) {
      // Fetch bootstrap
      pkgController.setData(await getBootstrapV2());
      // Fetch Store listing (if on store type page);
      isStoreListingPage && pkgController.setStoreData(await getStoreListing());
      // Now attempt to get pup from memory
      pup = pkgController.getPupMaster({
        pupId,
        sourceId,
        pupName,
        lookupType,
      }).pup;
    }

    if (!pup) {
      // Still no pup after bootstrapping. That's a proper 404.
      console.warn("[404] loadPup middleware: pup not found in memory");
      store.updateState({
        pupContext: { ready: true, result: 404 },
      });
      return;
    }

    // Return happy result
    store.updateState({
      pupContext: { ...pup, ready: true, result: 200 },
    });
  } catch (error) {
    console.warn("[500] loadPup middleware: failure.", error);
    store.updateState({
      pupContext: { ready: true, result: 500 },
    });
  }
}

export function isAuthed(context: RouteContext, commands: RouteCommands): undefined {
  if (store.networkContext.token) {
    return undefined;
  } else {
    return commands.redirect("/login");
  }
}

export function performLogout(context: RouteContext, commands: RouteCommands): never {
  store.updateState({ networkContext: { token: null } });
  return commands.redirect("/login");
}

export function asPage(context: RouteContext, commands: RouteCommands) {
  if (context.route.dynamicTitle) {
    context.route.pageTitle = decodeURIComponent(context.params.pupname);
    context.route.pageAction = "back";
  }

  const {
    componentClass: ComponentClass,
    pageTitle,
    pageAction,
  } = context.route;

  // Create instance of page-container
  const PageContainer = customElements.get("page-container")!;
  const pageContainer: HTMLElement & {
    pageTitle?: string;
    pageAction?: string;
  } = new PageContainer();

  // Set properties on the page-container per the route definition.
  pageContainer.pageTitle = pageTitle;
  pageContainer.pageAction = pageAction;

  // Wrap route component in page-container.
  const childComponent = new ComponentClass!();
  pageContainer.appendChild(childComponent);

  // Override route component withly newly wrapped component
  context.route.componentInstance = pageContainer;
}

export function withDialog(context: RouteContext, commands: RouteCommands) {
  store.updateState({
    dialogContext: { name: context?.params?.dialog },
  });
}
