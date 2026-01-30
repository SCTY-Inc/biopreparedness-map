import { state } from './state.js';

export function normalizeStatus(status) {
  return (status || '').toLowerCase();
}

export function getStatusKey(status) {
  const normalized = normalizeStatus(status);
  const definitions = getStatusDefinitions();

  for (const [key, definition] of definitions) {
    const includesMatch = definition.match?.includes?.some((term) => normalized.includes(term));
    const excludesMatch = definition.match?.excludes?.some((term) => normalized.includes(term));

    if (includesMatch && !excludesMatch) {
      return key;
    }
  }

  return null;
}

export function getStatusInfo(status) {
  const key = getStatusKey(status);
  return {
    key,
    normalized: normalizeStatus(status),
    isEndemic: key === 'endemic',
    isOutbreak: key === 'continued' || key === 'noTransmission',
    isContinued: key === 'continued',
    isNoTransmission: key === 'noTransmission',
  };
}

export function getStatusPriority(status) {
  const key = getStatusKey(status);
  const definitions = getStatusDefinitionMap();
  return key ? definitions[key].priority : 0;
}

export function getStatusColor(status) {
  const key = getStatusKey(status);
  const definitions = getStatusDefinitionMap();
  return key ? definitions[key].color : '#95a5a6';
}

export function getStatusClass(status) {
  const key = getStatusKey(status);
  const definitions = getStatusDefinitionMap();
  return key ? definitions[key].className : '';
}

export function getStatusDefinitionMap() {
  return state.config?.statusDefinitions || {};
}

function getStatusDefinitions() {
  return Object.entries(getStatusDefinitionMap());
}
