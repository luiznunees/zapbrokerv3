export const PLAN_LIMITS: Record<string, { maxInstances: number; maxMonthlyMessages: number }> = {
    'prod_ZxwseRQWbKLxHKsnfcUCMfYc': { // Basic
        maxInstances: 1,
        maxMonthlyMessages: 50
    },
    'prod_n6CMApuNhHqPCUrL2JmHyWbz': { // Plus
        maxInstances: 3,
        maxMonthlyMessages: 100
    },
    'prod_AXPStPBEeB5xrpubKyWB6EnY': { // Pro
        maxInstances: 10,
        maxMonthlyMessages: 250
    }
};

export const DEFAULT_LIMITS = {
    maxInstances: 0,
    maxMonthlyMessages: 0
};
