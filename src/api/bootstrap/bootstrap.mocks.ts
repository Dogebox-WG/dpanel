import { generateManifests } from "/api/manifest/manifest.mocks.js";
import type { LegacyMockManifest, LegacyMockManifests } from "/api/manifest/manifest.mocks.js";
import type { MockDescriptor } from "../client.js";

/** Value union produced by generateValue for a mock config field. */
type MockConfigValue = string | boolean | number | undefined;

/** Legacy pup-state shape produced by the bootstrap mock. */
interface MockPupState {
  id: string;
  package: string;
  source: string;
  status: string;
  stats: ReturnType<typeof generateRandomStats>;
  config: Record<string, MockConfigValue>;
  installation: string;
  enabled: boolean;
  needs_deps: boolean;
  needs_config: boolean;
}

export function generateBootstrap() {
  const manifests = generateManifests();
  const states = generateStates(manifests);
  return {
    manifests,
    states,
  }
}

function generateStates(manifests: LegacyMockManifests): Record<string, MockPupState> {
  const sources = [...manifests.local.available, ...(manifests.internal?.available ?? [])]
  return sources.reduce((out: Record<string, MockPupState>, p) => {
    if (['Core', 'Dogeboxd', 'Map', 'Identity', 'Tipjar', 'ShibeShop'].includes(p.package)) {
      out[p.package] = {
        id: p.id,
        package: p.package,
        source: 'local',
        status: ['Core', 'Dogeboxd', 'Map', 'Identity', 'Tipjar', 'ShibeShop'].includes(p.package) ? 'running' : 'stopped',
        stats: generateRandomStats(),
        config: generateConfigOptions(p.command.config),
        installation: "ready",
        enabled: !!['Core', 'Dogeboxd', 'Map', 'Identity', 'Tipjar', 'ShibeShop'].includes(p.package),
        needs_deps: false,
        needs_config: false,
      };
    }
    return out;
  }, {});
}

function generateConfigOptions(configManifest: LegacyMockManifest["command"]["config"]): Record<string, MockConfigValue> {
  return configManifest.sections.reduce((result: Record<string, MockConfigValue>, section) => {
    section.fields.forEach(field => {
      result[String(field.name)] = generateValue(String(field.name));
    });
    return result;
  }, {});
}

function generateValue(fieldName: string): string | boolean | number | undefined {
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

function generateRandomStats() {
  return {
    CPU_PERCENT_30: Array.from({ length: 6 }, () => Math.random()),
    MEM_PERCENT_30: Array.from({ length: 6 }, () => Math.random()),
  };
};

export const mock: MockDescriptor = {
  name: '/system/bootstrap (deprecating)',
  method: 'get',
  group: 'system',
  res: generateBootstrap
}