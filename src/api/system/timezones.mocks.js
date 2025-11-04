export const getResponse = {
  name: "/system/timezones",
  method: "get",
  group: "setup",
  res: [
    { id: "Australia/Brisbane", label: "Australia/Brisbane" },
    { id: "Australia/Melbourne", label: "Australia/Melbourne" },
    { id: "Europe/Lisbon", label: "Europe/Lisbon" },
  ],
};

export const postResponse = {
  name: "/system/timezones",
  method: "post",
  group: "setup",
  res: {
    success: true,
  },
};
