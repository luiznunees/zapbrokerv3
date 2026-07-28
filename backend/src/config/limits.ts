export const PLAN_LIMITS: Record<string, { maxInstances: number; maxMonthlyCampaigns: number; maxLeads: number }> = {
    'starter': { // Starter — R$39/mês (recorrente)
        maxInstances: 2,
        maxMonthlyCampaigns: 5,
        maxLeads: 500
    },
    'pro': { // Pro — R$79/mês (recorrente) — disparos liberados
        maxInstances: 5,
        maxMonthlyCampaigns: Infinity,
        maxLeads: Infinity
    }
};

// Aplicado quando o usuário não tem assinatura ativa (sem plano contratado)
export const DEFAULT_LIMITS = {
    maxInstances: 0,
    maxMonthlyCampaigns: 0,
    maxLeads: 0
};
