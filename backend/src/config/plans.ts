export const PLANS: Record<string, { name: string; price: number }> = {
    'starter': { name: 'ZapBroker - Starter', price: 3900 },
    'pro': { name: 'ZapBroker - Pro', price: 7900 },
};

// Add-ons cobrados junto com a assinatura (PIX manual mensal). O valor é somado ao
// amount do checkout de cada ciclo enquanto o usuário tiver o recurso ativo.
export const ADDONS: Record<string, { name: string; price: number }> = {
    'dedicated_number': { name: 'Número dedicado (Salvy)', price: 2990 },
};

export const DEDICATED_NUMBER_PRICE = ADDONS['dedicated_number'].price;
