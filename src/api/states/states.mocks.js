export function generateStatesV2(manifests, pupDefinitions = []) {
  return manifests.reduce((out, manifest, i) => {
    const pupDefinition = Array.isArray(pupDefinitions) ? pupDefinitions[i] : undefined;
    const id = pupDefinition?.id || `mock-pup-id-${i+1}`;
    const hasMockSidebarUI = Boolean(pupDefinition?.isSidebarMock);

    out[id] = {
      config: generateConfigValues(manifest.config),
      enabled: true,
      id: id,
      status: "running",
      installation: "ready",
      ip: generateRandomIp(),
      manifest: manifest,
      webUIs: hasMockSidebarUI ? [{ name: "Dashboard", port: 12000 + i }] : [],
      needsConf: false,
      needsDeps: false,
      source: {
        id: generateSourceId(manifest),
        location: generateSourceLocation(manifest),
        name: generateSourceName(manifest),
        type: "git",
      },
      version: manifest.meta.version,
    };
    return out;
  }, {});
}

function generateRandomIp() {
  return `10.0.0.${Math.floor(Math.random() * 255)}`;
}

function generateSourceLocation(manifest) {
  return `https://github.com/flibble/${manifest.meta.name.toLowerCase().replace(/\s+/g, '-')}.git`;
}

function generateSourceId(manifest) {
  return manifest.meta.name.toLowerCase().replace(/\s+/g, '-') + '-source';
}

function generateSourceName(manifest) {
  return manifest.meta.name.toLowerCase().replace(/\s+/g, '');
}

function generateConfigValues(config) {
  return config.sections.reduce((result, section) => {
    section.fields.forEach(field => {
      result[field.name] = generateValue(field.name);
    });
    return result;
  }, {});
}

function generateValue(fieldName) {
  if (fieldName.includes('text_')) {
    return 'Such wow';
  }

  if (fieldName.includes('textarea_')) {
    return 'Excepteur magna proident sed fugiat officia eiusmod adipisicing ad in id magna fugiat elit.';
  }

  if (fieldName.includes('number_')) {
    return Math.round(69 * Math.random()).toString();
  }

  if (fieldName.includes('checkbox_')) {
    return true;
  }

  if (fieldName.includes('toggle_')) {
    return false;
  }

  if (fieldName.includes('select_')) {
    return "purple";
  }

  if (fieldName.includes('rating_')) {
    return "4";
  }

  if (fieldName.includes('range_')) {
    return Math.round(69 * Math.random());
  }

  if (fieldName.includes('radio_')) {
    return "nuggets";
  }

  if (fieldName.includes('radioButton_')) {
    return "lime";
  }

  if (fieldName.includes('date_')) {
    return "2025-04-27";
  }

  if (fieldName.includes('color_')) {
    return "#e1b303";
  }
}

const staticStates = {
  "3ab3604bc6348ff85cfe175189af1e99": {
    config: {},
    enabled: true,
    id: "3ab3604bc6348ff85cfe175189af1e99",
    installation: "ready",
    ip: "10.0.0.2",
    manifest: {
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
      dependencies: null,
      manifestVersion: 1,
      meta: {
        logoPath: "",
        name: "s1w test pup",
        version: "0.0.5",
      },
      permissionGroups: null,
    },
    needsConf: false,
    needsDeps: false,
    source: {
      location: "https://github.com/SomeoneWeird/test-pup.git",
      name: "adamspup",
      type: "git",
    },
    version: "0.0.5",
  },
};
