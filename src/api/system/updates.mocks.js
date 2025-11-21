export const getResponse = {
  name: "/system/updates",
  method: "get",
  group: "updates",
  res: {
    packages: {
      "dogebox": {
        name: "Dogebox",
        currentVersion: "v0.3.2-beta.3",
        latestUpdate: "v0.3.2-beta.4",
        updates: [
          {
            version: "v0.3.2-beta.4",
            summary: "Update for Dogeboxd / DKM / DPanel",
            releaseURL: "https://github.com/dogeorg/dogebox/releases/tag/v0.3.2-beta.4",
            long: "",
          },
        ],
      }
    },
  }
};

export const postResponse = {
  name: "/system/update",
  method: "post",
  group: "updates",
  res: {
    success: true,
  }
};

