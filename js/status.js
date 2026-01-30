import { STATUS_DEFINITIONS, STATUS_MATCH_ORDER } from './config.js';

export function normalizeStatus(status) {
    return (status || '').toLowerCase();
}

export function getStatusKey(status) {
    const normalized = normalizeStatus(status);
    for (const key of STATUS_MATCH_ORDER) {
        if (STATUS_DEFINITIONS[key].match(normalized)) {
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
        isNoTransmission: key === 'noTransmission'
    };
}

export function getStatusPriority(status) {
    const key = getStatusKey(status);
    return key ? STATUS_DEFINITIONS[key].priority : 0;
}

export function getStatusColor(status) {
    const key = getStatusKey(status);
    return key ? STATUS_DEFINITIONS[key].color : '#95a5a6';
}

export function getStatusClass(status) {
    const key = getStatusKey(status);
    return key ? STATUS_DEFINITIONS[key].className : '';
}
