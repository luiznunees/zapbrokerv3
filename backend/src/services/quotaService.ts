import { supabase } from '../config/supabase';
import moment from 'moment-timezone';
import { PLAN_LIMITS, DEFAULT_LIMITS } from '../config/limits';

export class QuotaService {

    static getCurrentMonthRange() {
        const now = moment().tz('America/Sao_Paulo');
        const monthStart = now.clone().startOf('month').format('YYYY-MM-DD');
        const monthEnd = now.clone().endOf('month').format('YYYY-MM-DD');

        return { monthStart, monthEnd, month: now.month() + 1, year: now.year() };
    }

    static async getCurrentQuota(userId: string, planId: string) {
        const { monthStart, monthEnd } = this.getCurrentMonthRange();
        const limits = PLAN_LIMITS[planId] || DEFAULT_LIMITS;
        const planLimit = limits.maxMonthlyCampaigns; // cota de campanhas por mês

        const { data: existingQuota } = await supabase
            .from('weekly_quotas')
            .select('*')
            .eq('user_id', userId)
            .eq('week_start', monthStart)
            .eq('status', 'ACTIVE')
            .single();

        if (existingQuota) {
            return existingQuota;
        }

        const { data: newQuota, error } = await supabase
            .from('weekly_quotas')
            .insert({
                user_id: userId,
                week_start: monthStart,
                week_end: monthEnd,
                plan_limit: planLimit,
                messages_used: 0,
                messages_remaining: planLimit,
                status: 'ACTIVE'
            })
            .select()
            .single();

        if (error) throw new Error(`Failed to create quota: ${error.message}`);

        await this.logTransaction({
            userId,
            weeklyQuotaId: newQuota.id,
            messageCount: planLimit,
            type: 'RENEWAL',
            reason: 'Novo mês iniciado'
        });

        return newQuota;
    }

    /** Planos com cota ilimitada (ex: Pro) pulam a verificação por completo. */
    static isUnlimited(planId: string) {
        const limits = PLAN_LIMITS[planId] || DEFAULT_LIMITS;
        return !Number.isFinite(limits.maxMonthlyCampaigns);
    }

    static async checkAvailability(userId: string, planId: string, requestedCampaigns: number = 1) {
        if (this.isUnlimited(planId)) {
            return { available: true, remaining: Infinity, requested: requestedCampaigns, limit: Infinity };
        }

        const quota = await this.getCurrentQuota(userId, planId);

        return {
            available: quota.messages_remaining >= requestedCampaigns,
            remaining: quota.messages_remaining,
            requested: requestedCampaigns,
            limit: quota.plan_limit
        };
    }

    static async consumeQuota(userId: string, planId: string, campaignCount: number = 1, campaignId: string) {
        if (this.isUnlimited(planId)) return null;

        const quota = await this.getCurrentQuota(userId, planId);

        if (quota.messages_remaining < campaignCount) {
            throw new Error(`Cota insuficiente. Disponível: ${quota.messages_remaining}, Necessário: ${campaignCount}`);
        }

        const { data: updatedQuota, error } = await supabase
            .from('weekly_quotas')
            .update({
                messages_used: quota.messages_used + campaignCount,
                messages_remaining: quota.messages_remaining - campaignCount
            })
            .eq('id', quota.id)
            .select()
            .single();

        if (error) throw new Error(error.message);

        await this.logTransaction({
            userId,
            weeklyQuotaId: quota.id,
            campaignId,
            messageCount: campaignCount,
            type: 'USAGE',
            reason: 'Campanha criada'
        });

        return updatedQuota;
    }

    static async refundQuota(userId: string, planId: string, campaignCount: number, campaignId: string, reason: string) {
        if (this.isUnlimited(planId)) return;

        const quota = await this.getCurrentQuota(userId, planId);

        const newRemaining = Math.min(quota.messages_remaining + campaignCount, quota.plan_limit);
        const actualRefund = newRemaining - quota.messages_remaining;

        await supabase
            .from('weekly_quotas')
            .update({
                messages_used: quota.messages_used - actualRefund,
                messages_remaining: newRemaining
            })
            .eq('id', quota.id);

        await this.logTransaction({
            userId,
            weeklyQuotaId: quota.id,
            campaignId,
            messageCount: actualRefund,
            type: 'REFUND',
            reason
        });
    }

    static async expireOldQuotas() {
        const { monthStart } = this.getCurrentMonthRange();

        const { error } = await supabase
            .from('weekly_quotas')
            .update({ status: 'EXPIRED' })
            .lt('week_start', monthStart)
            .eq('status', 'ACTIVE');

        if (error) console.error('Error expiring quotas:', error);
    }

    static async getUsageHistory(userId: string) {
        const { data } = await supabase
            .from('weekly_quotas')
            .select('*, quota_transactions(*)')
            .eq('user_id', userId)
            .order('week_start', { ascending: false })
            .limit(4);
        return data;
    }

    private static async logTransaction(data: any) {
        await supabase.from('quota_transactions').insert({
            user_id: data.userId,
            weekly_quota_id: data.weeklyQuotaId,
            campaign_id: data.campaignId,
            message_count: data.messageCount,
            type: data.type,
            reason: data.reason
        });
    }
}
