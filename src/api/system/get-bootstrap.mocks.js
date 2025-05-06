export const getResponse = {
  name: "/system/bootstrap",
  method: "get",
  group: "setup",
  res: {
    success: true,
    setupFacts: {
      hasGeneratedKey: false,
      hasConfiguredNetwork: false,
      hasCompletedInitialConfiguration: false
    },
  }
};
