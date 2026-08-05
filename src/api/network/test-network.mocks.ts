export const postResponse = {
  name: "/system/network/test",
  method: "post",
  group: "networks",
  res: {
    success: true,
    message: "Network Connection Test Success",
  },
};

export const postResponseError = {
  success: false,
  error: "broke",
  message: "Network Connection Test Fail",
};
