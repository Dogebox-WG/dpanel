export const postResponse = {
  name: "/system/network/set-pending",
  method: "post",
  group: "networks",
  res: {
    success: true,
    message: "Network successfully set",
  }
}

export const postResponseError = {
  success: false,
  error: 'broke',
  message: "Network successfully set",
}
