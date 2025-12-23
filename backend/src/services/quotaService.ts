import { supabase } from '../config/supabase';
import moment from 'moment-timezone';
import { PLAN_LIMITS, DEFAULT_LIMITS } from '../config/limits';

export class QuotaService {

    static getCurrentWeekRange() {
        const now = moment().tz('America/Sao_Paulo');
        const weekStart = now.clone().startOf('isoWeek').format('YYYY-MM-DD');
        const weekEnd = now.clone().endOf('isoWeek').format('YYYY-MM-DD');

        return { weekStart, weekEnd, weekNumber: now.isoWeek(), year: now.year() };
    }

    static async getCurrentQuota(userId: string, planId: string) {
        const { weekStart, weekEnd } = this.getCurrentWeekRange();
        const limits = PLAN_LIMITS[planId] || DEFAULT_LIMITS;
        const planLimit = limits.maxMonthlyMessages; // Using maxMonthlyMessages as weekly limit for now based on user request "50 msgs/semana"

        // Check existing quota
        const { data: existingQuota } = await supabase
            .from('weekly_quotas')
            .select('*')
            .eq('user_id', userId)
            .eq('week_start', weekStart)
            .eq('status', 'ACTIVE')
            .single();

        if (existingQuota) {
            return existingQuota;
        }

        // Create new quota
        const { data: newQuota, error } = await supabase
            .from('weekly_quotas')
            .insert({
                user_id: userId,
                week_start: weekStart,
                week_end: weekEnd,
                plan_limit: planLimit,
                messages_used: 0,
                messages_remaining: planLimit,
                status: 'ACTIVE'
            })
            .select()
            .single();

        if (error) throw new Error(`Failed to create quota: ${error.message}`);

        // Log transaction
        await this.logTransaction({
            userId,
            weeklyQuotaId: newQuota.id,
            messageCount: planLimit,
            type: 'RENEWAL',
            reason: 'Nova semana iniciada'
        });

        return newQuota;
    }

    static async checkAvailability(userId: string, planId: string, requestedMessages: number) {
        const quota = await this.getCurrentQuota(userId, planId);

        return {
            available: quota.messages_remaining >= requestedMessages,
            remaining: quota.messages_remaining,
            requested: requestedMessages,
            limit: quota.plan_limit
        };
    }

    static async consumeQuota(userId: string, planId: string, messageCount: number, campaignId: string) {
        const quota = await this.getCurrentQuota(userId, planId);

        if (quota.messages_remaining < messageCount) {
            throw new Error(`Cota insuficiente. Disponível: ${quota.messages_remaining}, Necessário: ${messageCount}`);
        }

        const { data: updatedQuota, error } = await supabase
            .from('weekly_quotas')
            .update({
                messages_used: quota.messages_used + messageCount,
                messages_remaining: quota.messages_remaining - messageCount
            })
            .eq('id', quota.id)
            .select()
            .single();

        if (error) throw new Error(error.message);

        await this.logTransaction({
            userId,
            weeklyQuotaId: quota.id,
            campaignId,
            messageCount,
            type: 'USAGE',
            reason: 'Campanha criada'
        });

        return updatedQuota;
    }

    static async refundQuota(userId: string, planId: string, messageCount: number, campaignId: string, reason: string) {
        const quota = await this.getCurrentQuota(userId, planId);

        const newRemaining = Math.min(quota.messages_remaining + messageCount, quota.plan_limit);
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
        const { weekStart } = this.getCurrentWeekRange();

        const { error } = await supabase
            .from('weekly_quotas')
            .update({ status: 'EXPIRED' })
            .lt('week_start', weekStart)
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
