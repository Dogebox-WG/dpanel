import { generateManifestsV2 } from "../manifest/manifest.mocks.v2.js";
import { generateStatesV2 } from "../states/states.mocks.js"
import { getMockConfig as getSidebarPupsMockConfig } from "../sidebar-pups/sidebar-pups.mocks.js";

export const mockV2 = {
  name: '/system/bootstrap',
  method: 'get',
  group: 'system',
  res: generateBootstrapV2
}

function generateBootstrapV2(path, options) {
  const { body, method, forceFailures, networkContext } = options || {};
  
  // Build pup list based on enabled mocks
  const pupDefinitions = [
    { name: "Dogeboxd" },
    { name: "Core" },
  ];
  
  // Check if Core green is enabled via network context
  // The mock key format is: mock::GROUP::NAME::METHOD
  const coreGreenEnabled = networkContext?.['mock::monitoring::Core green::get'];
  const sakuraEnabled = networkContext?.['mock::monitoring::Sakura::get'];
  
  if (coreGreenEnabled) {
    pupDefinitions.push({ name: "Core green" });
  }
  
  if (sakuraEnabled) {
    pupDefinitions.push({ name: "Sakura" });
  }
  
  pupDefinitions.push({ name: "GigaWallet" });

  const sidebarPupConfig = getSidebarPupsMockConfig();
  const sidebarPupDefinitions = (sidebarPupConfig.pups || []).map((pup) => ({
    id: pup.id,
    name: pup.name,
    isSidebarMock: true,
  }));
  pupDefinitions.push(...sidebarPupDefinitions);

  const pups = pupDefinitions.map((pup) => pup.name);
  
  console.log('[Bootstrap Mock] Generating bootstrap with pups:', pups);
  console.log('[Bootstrap Mock] Core green enabled:', coreGreenEnabled);
  console.log('[Bootstrap Mock] Sakura enabled:', sakuraEnabled);
  
  const manifests = generateManifestsV2(pups);
  const states = generateStatesV2(manifests, pupDefinitions);
  const setupFacts = generateSetupFacts();
  const stats = generateRandomStatsV2(states, manifests);
  const assets = generateAssetsV2(states);
  const sidebarPupIds = sidebarPupDefinitions.map((pup) => pup.id);

  return {
    manifests,
    setupFacts,
    states,
    stats,
    assets,
    sidebarPreferences: {
      sidebarPups: sidebarPupIds,
    },
  }
}

function generateAssetsV2(states) {
  // Generate empty assets for each pup state
  return Object.keys(states).reduce((assets, stateId) => {
    assets[stateId] = {
      logos: {
        mainLogoBase64: null
      }
    };
    return assets;
  }, {});
}

function generateSetupFacts() {
  return { hasCompletedInitialConfiguration: true, hasConfiguredNetwork: true, hasGeneratedKey: true };
}

function generateRandomStatsV2(states, manifests) {
  return Object.keys(states).reduce((stats, stateId, index) => {
    const manifest = manifests[index];
    const hasMetrics = manifest?.metrics && manifest.metrics.length > 0;
    
    stats[stateId] = {
      id: stateId,
      status: "running", // Always running for testing
      systemMetrics: [],
      metrics: hasMetrics ? generateMetricsForManifest(manifest.metrics) : [],
      issues: {}
    };
    return stats;
  }, {});
}

function generateRandomValues() {
  return {
    Head: Math.floor(Math.random() * 32),
    Values: Array.from({ length: 32 }, () => Math.floor(Math.random() * 100)),
  };
}

function generateMetricsForManifest(metricsDefinition) {
  return metricsDefinition.map(metricDef => {
    let values;
    
    switch(metricDef.type) {
      case 'string':
        // For string metrics, just provide one or a few values
        if (metricDef.name === 'chain') {
          values = ['main'];
        } else if (metricDef.name === 'verification_progress') {
          values = ['99.98%'];
        } else if (metricDef.name === 'initial_block_download') {
          values = ['false'];
        } else if (metricDef.name === 'chain_size_human') {
          values = ['88.5 GB'];
        } else {
          values = ['Sample Value'];
        }
        break;
      case 'int':
        // For int metrics, generate a history of values
        const historySize = metricDef.history || 30;
        values = Array.from({ length: historySize }, (_, i) => {
          if (metricDef.name === 'blocks') {
            return 5500000 + i * 10;
          } else if (metricDef.name === 'headers') {
            return 5500100 + i * 10;
          }
          return Math.floor(Math.random() * 1000);
        });
        break;
      case 'float':
        // For float metrics, generate a history of values
        const floatHistorySize = metricDef.history || 30;
        values = Array.from({ length: floatHistorySize }, () => {
          if (metricDef.name === 'difficulty') {
            return 5000000 + Math.random() * 100000;
          }
          return Math.random() * 100;
        });
        break;
      default:
        values = [];
    }
    
    return {
      name: metricDef.name,
      label: metricDef.label,
      type: metricDef.type,
      values: values
    };
  });
}