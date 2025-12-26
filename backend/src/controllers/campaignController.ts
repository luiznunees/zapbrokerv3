import { Request, Response } from 'express';
import * as campaignService from '../services/campaignService';
import { AuthRequest } from '../middlewares/authMiddleware';
import { QuotaService } from '../services/quotaService';
import { supabase } from '../config/supabase';

import { createCampaignSchema } from '../validators/campaignValidator';

export const create = async (req: AuthRequest, res: Response) => {
    try {
        console.log('[CampaignCreate] Starting creation...', req.body);
        const userId = req.user.id;

        // Zod Validation
        const validatedData = createCampaignSchema.parse(req.body);
        const { name, messageVariations, contactListId, instanceId, delaySeconds, batchSize, batchDelaySeconds, mediaType } = validatedData;
        const scheduledAt = req.body.scheduledAt;

        let mediaUrl = undefined;
        if (req.file) {
            const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
            mediaUrl = `${baseUrl}/uploads/${req.file.filename}`;
        }

        console.log('[CampaignCreate] Calling Service...');
        const result = await campaignService.createCampaign(
            userId,
            name,
            messageVariations,
            contactListId,
            instanceId,
            scheduledAt,
            delaySeconds,
            batchSize,
            batchDelaySeconds,
            mediaType,
            mediaUrl
        );
        console.log('[CampaignCreate] Service Success:', result.id);

        // Consume Quota
        const userPlanId = (req as any).userPlanId;
        const messageCount = (req as any).quotaCheck?.requested || 0;

        if (userPlanId && messageCount > 0) {
            try {
                await QuotaService.consumeQuota(userId, userPlanId, messageCount, result.id);
            } catch (quotaError) {
                console.error('Error consuming quota:', quotaError);
            }
        }

        res.status(201).json(result);
    } catch (error: any) {
        console.error('[CampaignCreate] ERROR:', error);
        if (error.name === 'ZodError' || error.issues) {
            const issues = error.issues || error.errors || [];
            return res.status(400).json({
                error: 'Erro de validação',
                details: issues,
                message: issues[0]?.message || "Dados inválidos"
            });
        }
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
};

export const list = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user.id;
        const result = await campaignService.getCampaigns(userId);
        res.status(200).json(result);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const getKanban = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user.id;
        const { campaignId } = req.params;
        const result = await campaignService.getKanbanBoard(userId, campaignId);
        res.status(200).json(result);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const updateLeadStatus = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user.id;
        const { messageId } = req.params;
        const { status } = req.body;
        const result = await campaignService.updateLeadStatus(userId, messageId, status);
        res.status(200).json(result);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const getDetails = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const result = await campaignService.getCampaignDetails(userId, id);
        res.status(200).json(result);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const debugStatus = async (req: Request, res: Response) => {
    try {
        const { campaignId, contactListId } = req.query;

        if (campaignId) {
            const { data } = await supabase
                .from('campaign_messages')
                .select('id, status, error_message, updated_at')
                .eq('campaign_id', campaignId);
            return res.json({ campaignId, messages: data, count: data?.length });
        }

        if (contactListId) {
            const { count } = await supabase
                .from('contacts')
                .select('id', { count: 'exact', head: true })
                .eq('list_id', contactListId);
            return res.json({ contactListId, count });
        }

        // Default: Global Status
        const { data: pending } = await supabase.from('campaign_messages').select('id').eq('status', 'PENDING');
        const { data: queued } = await supabase.from('campaign_messages').select('id').eq('status', 'QUEUED');
        const { data: sent } = await supabase.from('campaign_messages').select('id').eq('status', 'SENT');
        const { data: failed } = await supabase.from('campaign_messages').select('id').eq('status', 'FAILED');

        const { data: failedDetails } = await supabase
            .from('campaign_messages')
            .select('id, error_message, updated_at')
            .eq('status', 'FAILED')
            .order('updated_at', { ascending: false })
            .limit(5);

        res.json({
            PENDING: pending?.length,
            QUEUED: queued?.length,
            SENT: sent?.length,
            FAILED: failed?.length,
            RecentFailures: failedDetails
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};
