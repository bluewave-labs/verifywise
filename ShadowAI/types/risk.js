"use strict";
/**
 * Risk scoring types for Shadow AI events.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DATA_SENSITIVITY = exports.ACTION_SEVERITY = exports.DEPARTMENT_SENSITIVITY = exports.DEFAULT_RISK_THRESHOLDS = void 0;
exports.DEFAULT_RISK_THRESHOLDS = {
    critical: 80,
    high: 60,
    medium: 40,
    low: 20,
};
/** Department sensitivity ratings */
exports.DEPARTMENT_SENSITIVITY = {
    finance: 15,
    legal: 15,
    hr: 12,
    executive: 12,
    compliance: 10,
    engineering: 5,
    marketing: 3,
    sales: 3,
    it: 5,
    default: 5,
};
/** Action type severity scores */
exports.ACTION_SEVERITY = {
    upload: 20,
    data_share: 18,
    prompt: 12,
    api_call: 10,
    download: 8,
    login: 4,
    access: 5,
    other: 5,
};
/** Data classification sensitivity scores */
exports.DATA_SENSITIVITY = {
    restricted: 25,
    phi: 25,
    pii: 22,
    financial: 20,
    confidential: 18,
    internal: 10,
    public: 2,
    unknown: 12,
};
