export const getResponse = {
  name: "/system/bootstrap",
  method: "get",
  group: "setup",
  res: {
    success: true,
    setupFacts: {
      setupSessionId: "mock-setup-session",
      hasGeneratedKey: false,
      hasConfiguredNetwork: false,
      hasCompletedInitialConfiguration: false
    },
  }
};
