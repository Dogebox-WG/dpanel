import { asyncTimeout } from "/utils/timeout.js";

const msg = {
  "id": "",
  "error": "",
  "type": "status",
  "update": {}
}

function asStatusUpdate(pupId, newState) {
  const out = { ...msg }
  out.update[pupId] = {
    installation: newState[0],
    status: newState[1]
  }
  return out;
}

export async function performMockCycle(cycle, fn) {
  for (let i = 0; i < cycle.length; i++) {
    await asyncTimeout(8000);
    await fn(asStatusUpdate("ShibeShop", cycle[i]));
  }
}

export const c1 = [
  ["", ""],
  ["installing", ""],
  ["unready", ""],
  ["ready", ""]
];

export const c2 = [
  ["", ""],
  ["installing", ""],
  ["ready", "configure"],
];

export const c3 = [
  ["", ""],
  ["installing", ""],
  ["ready", "configure"],
];

export const c4 = [
  ["", ""],
  ["installing", ""],
  ["broken", ""],
  ["ready", "needs_config"],
  ["ready", "starting"],
  ["ready", "enabled"],
  ["ready", "stopping"],
  ["ready", "disabled"],
];

export const c5 = [
  ["ready", "starting"],
  ["ready", "running"],
  ["ready", "stopping"],
  ["ready", "stopped"]
]

export const mockInstallEvent = {
  "id": "internal",
  "error": "",
  "type": "pup",
  "update": {
    "id": "23956456098893245a104cb39e9c055f",
    "source": {
      "id": "b215d6a7bcf215ca00e02f9cb6a41d12",
      "name": "s1w test pup",
      "description": "",
      "location": "https://github.com/Dogebox-WG/pups.git",
      "type": "git"
    },
    "manifest": {
      "manifestVersion": 1,
      "meta": {
        "name": "s1w test pup",
        "version": "0.0.8",
        "logoPath": "",
        "shortDescription": "my little test pup",
        "longDescription": "this pup has two services that run in it, server1 and server2. They each host a http server on port 8080 and 8081 respectively."
      },
      "config": { "sections": null },
      "container": {
        "build": {
          "nixFile": "pup.nix",
          "nixFileSha256": "bb405c5f11b287cf8f01fd9d8dc504ffe43f2efa9ba292902e761c8670d798eb"
        },
        "services": [
          {
            "name": "server1",
            "command": { "exec": "/bin/server1", "cwd": "", "env": null }
          },
          {
            "name": "server2",
            "command": { "exec": "/bin/server2", "cwd": "", "env": null }
          }
        ],
        "exposes": [
          {
            "type": "admin",
            "trafficType": "http",
            "port": 8080,
            "interfaces": null
          },
          {
            "type": "admin",
            "trafficType": "http",
            "port": 8081,
            "interfaces": null
          }
        ]
      },
      "interfaces": null,
      "dependencies": []
    },
    "config": {},
    "providers": null,
    "installation": "installing",
    "enabled": false,
    "needsConf": false,
    "needsDeps": false,
    "ip": "10.0.0.16",
    "version": "0.0.8"
  }
}
