export const getTailscaleStateResponse = {
  name: "/system/tailscale/state",
  group: "Tailscale",
  method: "get",
  res: {
    success: true,
    enabled: false,
    hostname: "",
    effectiveHostname: "dogebox-test",
    advertiseRoutes: "",
    tags: "",
    listenPort: 41641,
    hasAuthKey: false
  }
};

export const setTailscaleStateResponse = {
  name: "/system/tailscale/state",
  group: "Tailscale",
  method: "put",
  res: {
    success: true,
  }
};

export const setTailscaleConfigResponse = {
  name: "/system/tailscale/config",
  group: "Tailscale",
  method: "put",
  res: {
    success: true,
  }
};

export const getTailscaleStatusResponse = {
  name: "/system/tailscale/status",
  group: "Tailscale",
  method: "get",
  res: {
    success: true,
    running: true,
    backendState: "Running",
    tailscaleIP: "100.64.0.1",
    hostname: "dogebox.tail12345.ts.net",
    online: true,
  }
};

