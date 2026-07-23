export const getProvidersResponse = {
  name: "/providers/:pupid",
  group: "provders",
  method: "get",
  res: [{
    "interface": "pingpong",
    "version": "0.0.1",
    "currentProvider": "",
    "installedProviders": [],
    "InstallableProviders": [
      {
        "sourceLocation": "https://github.com/tjstebbing/pingpongpups.git",
        "pupName": "pong",
        "pupVersion": "0.0.8"
      }
    ],
    "DefaultProvider": {
      "sourceLocation": "",
      "pupName": "",
      "pupVersion": ""
    }
  }]
}

export const setProviderResponse = {
  name: "/providers/:pupid",
  group: "provders",
  method: "post",
  res: { success: true }
}