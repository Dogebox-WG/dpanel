export const storeListingMock = {
  name: '/sources/store',
  method: 'get',
  group: 'sources',
  res: () => _generateStoreListingResponse({
    fdn: ["ShibeShop", "Identity"],
    sourdoge: ["SuchBake", "SoBread"]
  })
}

function _generateStoreListingResponse(sources) {
  const response = {};

  for (const [sourceId, pups] of Object.entries(sources)) {
    response[sourceId] = {
      lastUpdated: new Date().toISOString(),
      pups: {}
    };

    pups.forEach((pupName, i) => {
      response[sourceId].pups[pupName.toLowerCase()] = {
        latestVersion: "1.0.3",
        versions: {
          "0.0.1": generateVersionData("0.0.1", pupName),
          "1.0.0": generateVersionData("1.0.0", pupName),
          "1.0.3": generateVersionData("1.0.3", pupName)
        }
      };
    });
  }

  return response;
}

function generateVersionData(version, pupName) {
  return {
    config: { sections: null },
    container: {
      build: { nixFile: "pup.nix", nixFileSha256: "" },
      exposes: [{ port: 8080, trafficType: "http", type: "admin", } ],
      services: [{ command: { cwd: "", env: null, exec: `/bin/${pupName.toLowerCase()}`, }, name: "main", }],
    },
    dependencies: [],
    manifestVersion: 1,
    meta: {
      logoPath: "",
      name: pupName,
      version: version,
      descShort: "Such package, much use.",
      descLong: "Anim qui in sunt in ea dolore voluptate cillum excepteur consectetur pariatur tempor adipisicing cupidatat dolor ullamco ullamco quis sed ullamco amet voluptate magna labore dolor elit nisi magna est ut qui nulla ex esse duis nostrud occaecat amet ea fugiat minim sint ad in sed laborum fugiat aliqua excepteur sit eiusmod do deserunt ut nisi enim dolor esse reprehenderit consectetur mollit irure do in aliquip esse aliqua reprehenderit deserunt excepteur enim dolor exercitation qui occaecat non culpa voluptate anim cupidatat commodo amet dolor reprehenderit velit reprehenderit officia ea exercitation labore cillum mollit irure nostrud pariatur cupidatat deserunt laborum esse incididunt fugiat reprehenderit consectetur adipisicing mollit non in labore sit eiusmod pariatur elit mollit velit cupidatat eu consectetur amet eiusmod cillum occaecat consectetur culpa dolore consequat sunt voluptate cillum magna nulla labore esse ut dolor laboris enim veniam sit excepteur deserunt duis cupidatat minim culpa aliqua dolor ad velit pariatur aliquip proident eu non proident enim voluptate officia commodo occaecat sit commodo voluptate consequat magna laboris et in elit veniam consequat excepteur sit qui officia ut deserunt et cillum exercitation enim elit consectetur non anim do aliquip nostrud incididunt veniam veniam sit veniam in aliqua laboris consectetur irure in veniam occaecat est consectetur nisi non est culpa dolor aliqua velit reprehenderit mollit exercitation in magna dolor irure.",
    },
    permissionGroups: [],
  };
}

function generateStoreListingResponse() {
  return {
    "mock-source-fdn": {
      lastUpdated: "2024-09-04T10:23:14+10:00",
      pups: {
        "mock-test-pup": {
          versions: {
            "": {
              config: {
                sections: null,
              },
              container: {
                build: {
                  nixFile: "",
                  nixFileSha256: "",
                },
                exposes: null,
                services: null,
              },
              dependencies: null,
              manifestVersion: 0,
              meta: {
                logoPath: "",
                name: "",
                version: "",
              },
              permissionGroups: null,
            },
            "0.0.3-dev": {
              config: {
                sections: null,
              },
              container: {
                build: {
                  nixFile: "",
                  nixFileSha256: "",
                },
                exposes: null,
                services: null,
              },
              dependencies: null,
              manifestVersion: 0,
              meta: {
                logoPath: "",
                name: "",
                version: "0.0.3-dev",
              },
              permissionGroups: null,
            },
            "0.0.4": {
              config: {
                sections: null,
              },
              container: {
                build: {
                  nixFile: "pup.nix",
                  nixFileSha256: "",
                },
                exposes: [
                  {
                    port: 80,
                    trafficType: "http",
                    type: "admin",
                  },
                  {
                    port: 81,
                    trafficType: "http",
                    type: "admin",
                  },
                ],
                services: [
                  {
                    command: {
                      cwd: "/bin/",
                      env: {},
                      exec: "/bin/start-server1",
                    },
                    name: "server1",
                  },
                  {
                    command: {
                      cwd: "/bin/",
                      env: {},
                      exec: "/bin/start-server2",
                    },
                    name: "server2",
                  },
                ],
              },
              dependencies: [],
              manifestVersion: 1,
              meta: {
                logoPath: "",
                name: "s1w test pup",
                version: "0.0.4",
              },
              permissionGroups: [],
            },
            "0.0.5": {
              config: {
                sections: null,
              },
              container: {
                build: {
                  nixFile: "pup.nix",
                  nixFileSha256: "",
                },
                exposes: [
                  {
                    port: 8080,
                    trafficType: "http",
                    type: "admin",
                  },
                  {
                    port: 8081,
                    trafficType: "http",
                    type: "admin",
                  },
                ],
                services: [
                  {
                    command: {
                      cwd: "",
                      env: null,
                      exec: "/bin/server1",
                    },
                    name: "server1",
                  },
                  {
                    command: {
                      cwd: "",
                      env: null,
                      exec: "/bin/server2",
                    },
                    name: "server2",
                  },
                ],
              },
              dependencies: [],
              manifestVersion: 1,
              meta: {
                logoPath: "",
                name: "s1w test pup",
                version: "0.0.5",
              },
              permissionGroups: [],
            },
          },
        },
      },
    },
  };
}
