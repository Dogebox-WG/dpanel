export const getSidebarPreferencesResponse = {
  name: "/system/sidebar-preferences",
  method: "get",
  group: "system",
  res: {
    sidebarPups: [],
  },
};

export const addSidebarPupResponse = {
  name: "/system/sidebar-preferences/pups/add",
  method: "post",
  group: "system",
  res: {
    status: "OK",
  },
};

export const removeSidebarPupResponse = {
  name: "/system/sidebar-preferences/pups/remove",
  method: "post",
  group: "system",
  res: {
    status: "OK",
  },
};
