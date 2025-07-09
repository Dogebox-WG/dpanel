export const getResponse = {
  name: "/system/recovery-bootstrap",
  method: "get",
  group: "system",
  res: {
    success: true,
    recoveryFacts: {
      installationMode: "",
      isInstalled: false
    }
  }
}; 