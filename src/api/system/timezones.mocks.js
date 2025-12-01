export const getTimezonesResponse = {
  name: "/system/timezones",
  method: "get",
  group: "setup",
  res: [
    { id: "Australia/Brisbane", label: "Australia/Brisbane" },
    { id: "Australia/Melbourne", label: "Australia/Melbourne" },
    { id: "Europe/Lisbon", label: "Europe/Lisbon" },
  ],
};

export const getTimezoneResponse = {
  name: "/system/timezone",
  method: "get",
  group: "setup",
  res: "Australia/Melbourne"
}

export const postResponse = {
  name: "/system/timezone",
  method: "post",
  group: "setup",
  res: {
    success: true,
  },
};
