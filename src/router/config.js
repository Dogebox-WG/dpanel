import {
  isAuthed,
  loadPup,
  asPage,
  withDialog,
  performLogout,
} from "./middleware.js";

export const routes = [
  // {
  //   path: "/",
  //   component: "x-page-home",
  //   pageTitle: "Home",
  //   before: [isAuthed, asPage]
  // },
  {
    path: "/",
    before: [(ctx, cmd) => cmd.redirect("/explore")],
  },
  {
    path: "/logout",
    before: [performLogout],
  },
  {
    path: "/login",
    component: "x-action-login",
  },
  {
    path: "/stats",
    component: "x-page-stats",
    pageTitle: "Stats",
    before: [isAuthed, asPage],
  },
  {
    path: "/activity",
    component: "x-page-activity",
    pageTitle: "System Activity",
    before: [isAuthed, asPage],
  },
  {
    path: "/settings",
    component: "x-page-settings",
    pageTitle: "Settings",
    before: [isAuthed, asPage],
  },
  {
    path: "/settings/customise-os",
    component: "x-page-customise-os",
    pageTitle: "Customise OS",
    pageAction: "back",
    before: [isAuthed, asPage],
    animate: true,
  },
  {
    path: "/settings/:dialog",
    component: "x-page-settings",
    pageTitle: "Settings",
    before: [isAuthed, asPage, withDialog],
  },
  {
    path: "/pups",
    component: "x-page-pup-library",
    pageTitle: "Installed Pups",
    before: [isAuthed, asPage],
  },
  {
    path: "/pups/:pupid/:pupname",
    component: "x-page-pup-library-listing",
    dynamicTitle: true,
    pageAction: "back",
    before: [isAuthed, asPage],
    after: [loadPup],
    animate: true,
  },
  {
    path: "/pups/:pupid/:name/logs",
    component: "x-page-pup-logs",
    pageTitle: "Logs",
    pageAction: "close",
    before: [isAuthed, asPage],
    after: [loadPup],
    animate: true,
  },
  {
    path: "/explore",
    component: "x-page-pup-store",
    pageTitle: "Explore Pups",
    before: [isAuthed, asPage],
  },
  {
    path: "/explore/:sourceid/:pupname",
    component: "x-page-pup-store-listing",
    dynamicTitle: true,
    pageAction: "back",
    before: [isAuthed, asPage],
    after: [loadPup],
    animate: true,
  },
  {
    path: "/explore/:pupid/:pupname/ui",
    component: "x-page-pup-iframe",
    dynamicTitle: true,
    pageAction: "close",
    before: [isAuthed, asPage],
    animate: true,
  },
];

