export const getResponse = {
  name: "/system/keymaps",
  method: "get",
  group: "setup",
  res: [
    { id: "en_01", label: "English" },
    { id: "pt_01", label: "Portuguese" },
  ],
};

export const postResponse = {
  name: "/system/keymaps",
  method: "post",
  group: "setup",
  res: {
    success: true,
  },
};
