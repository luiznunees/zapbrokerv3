export const PLAN_INFO: Record<string, { name: string; price: number; features: string[] }> = {
    'starter': {
        name: 'Starter',
        price: 39,
        features: ['5 campanhas de disparo por mês', '500 leads', '2 conexões WhatsApp', 'Suporte prioritário'],
    },
    'pro': {
        name: 'Pro',
        price: 79,
        features: ['Disparos liberados (sem limite de campanhas)', 'Leads ilimitados', '5 conexões WhatsApp', 'Suporte VIP'],
    },
}
