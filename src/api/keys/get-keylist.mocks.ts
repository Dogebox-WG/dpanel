export const getResponse = {
  name: "/keys",
  group: "Keys",
  method: "get",
  res: {
    success: true,
    keys: [],
  }
};

export const getMockList = {
  success: true,
  keys: [{ type: "master", created: Date.now() }],
};
