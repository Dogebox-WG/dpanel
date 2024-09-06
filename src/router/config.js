import { loadPup, loadPupDefinition, asPage, performLogout } from "./middleware.js"

export const routes = [
  {
    path: "/",
    component: "x-page-home",
    pageTitle: "Home",
    before: [asPage]
  },
  {
    path: "/logout",
    before: [performLogout]
  },
  {
    path: "/login",
    component: "x-action-login",
  },
  {
    path: "/stats",
    component: "x-page-stats",
    pageTitle: "Stats",
    before: [asPage]
  },
  {
    path: "/settings",
    component: "x-page-settings",
    pageTitle: "Settings",
    before: [asPage]
  },
  {
    path: "/pups",
    component: "x-page-pup-library",
    pageTitle: "Installed Pups",
    before: [asPage]
  },
  {
    path: "/pups/:pup/:name",
    component: "x-page-pup-library-listing",
    dynamicTitle: true,
    pageAction: "back",
    before: [asPage],
    after: [loadPup],
    animate: true,
  },
  {
    path: "/pups/:s/:name/logs",
    component: "x-page-pup-logs",
    pageTitle: "Logs",
    pageAction: "close",
    before: [asPage],
    after: [loadPup],
    animate: true,
  },
  {
    path: "/explore",
    component: "x-page-pup-store",
    pageTitle: "Explore Pups",
    before: [asPage],
  },
  {
    path: "/explore/:source/:name",
    component: "x-page-pup-store-listing",
    dynamicTitle: true,
    pageAction: "back",
    before: [asPage],
    after: [loadPupDefinition],
    animate: true,
  },
  {
    path: "/explore/:pup/:name/ui",
    component: "x-page-pup-iframe",
    dynamicTitle: true,
    pageAction: "close",
    before: [loadPup, asPage],
    animate: true
  }
]