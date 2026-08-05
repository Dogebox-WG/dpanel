const disks = [
  // Booted SD card.
  {
    name: "/dev/mmcblk0",
    size: 31914983424,
    sizePretty: "29.72 GB",
    path: "/dev/mmcblk0",
    label: "",
    bootMedia: true,
    suitability: {
      install: { usable: true, sizeOK: true },
      storage: { usable: true, sizeOK: false },
      isAlreadyUsed: true,
    },
  },
  // Small internal disk.
  {
    name: "/dev/sda",
    size: 37580963840,
    sizePretty: "35.00 GB",
    path: "/dev/sda",
    label: "",
    bootMedia: false,
    suitability: {
      install: { usable: true, sizeOK: true },
      storage: { usable: true, sizeOK: false },
      isAlreadyUsed: true,
    },
  },
  // Tiny device below the install size gate.
  {
    name: "/dev/mmcblk2boot0",
    size: 4194304,
    sizePretty: "4.00 MB",
    path: "/dev/mmcblk2boot0",
    label: "",
    bootMedia: false,
    suitability: {
      install: { usable: true, sizeOK: false },
      storage: { usable: true, sizeOK: false },
      isAlreadyUsed: false,
    },
  },
  // Large blank SATA install target.
  {
    name: "/dev/sdb",
    size: 500107862016,
    sizePretty: "465.76 GB",
    path: "/dev/sdb",
    label: "",
    bootMedia: false,
    suitability: {
      install: { usable: true, sizeOK: true },
      storage: { usable: true, sizeOK: true },
      isAlreadyUsed: false,
    },
  },
  // Loop-backed development disk.
  {
    name: "/dev/loop0",
    size: 68719476736,
    sizePretty: "64.00 GB",
    path: "/dev/loop0",
    label: "",
    bootMedia: false,
    suitability: {
      install: { usable: true, sizeOK: true },
      storage: { usable: true, sizeOK: false },
      isAlreadyUsed: false,
    },
  },
  // Large in-use NVMe disk.
  {
    name: "/dev/nvme0n1",
    size: 1000204886016,
    sizePretty: "931.51 GB",
    path: "/dev/nvme0n1",
    label: "",
    bootMedia: false,
    suitability: {
      install: { usable: true, sizeOK: true },
      storage: { usable: true, sizeOK: true },
      isAlreadyUsed: true,
    },
  },
];

export const getResponse = {
  name: "/system/disks",
  group: "setup",
  method: "get",
  res: disks,
};

export const getInstallResponse = {
  name: "/system/install-disks",
  group: "setup",
  method: "get",
  res: disks.filter(
    (disk) => disk.bootMedia !== true && disk?.suitability?.install?.usable && disk?.suitability?.install?.sizeOK,
  ),
};

export const postInstallLocationResponse = {
  name: "/system/install",
  group: "setup",
  method: "post",
  res: { success: true }
};

export const postStorageLocationResponse = {
  name: "/system/storage",
  group: "setup",
  method: "post",
  res: { success: true }
};