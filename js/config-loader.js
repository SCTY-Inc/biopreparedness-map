import { DEFAULT_CONFIG } from './config.js';
import { state } from './state.js';

export async function loadConfig() {
  try {
    const response = await fetch('config.json');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const config = await response.json();
    state.config = mergeConfig(DEFAULT_CONFIG, config);
  } catch (error) {
    console.warn('Falling back to default config:', error);
    state.config = DEFAULT_CONFIG;
  }
}

function mergeConfig(base, overrides) {
  return {
    ...base,
    ...overrides,
    map: {
      ...base.map,
      ...(overrides?.map || {}),
    },
    statusDefinitions: {
      ...base.statusDefinitions,
      ...(overrides?.statusDefinitions || {}),
    },
  };
}
