import { Request, Response } from 'express';
import * as adminService from '../services/adminService';
import { AuthRequest } from '../middlewares/authMiddleware';
import * as eventLogService from '../services/eventLogService';

export const getStats = async (req: AuthRequest, res: Response) => {
    try {
        const stats = await adminService.getSystemStats();
        res.status(200).json(stats);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const listUsers = async (req: AuthRequest, res: Response) => {
    try {
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 20;
        const search = req.query.search as string;

        const result = await adminService.getUsers(page, limit, search);
        res.status(200).json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const banUser = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        await adminService.banUser(id);
        eventLogService.logEvent({
            type: 'admin.user_banned',
            severity: 'info',
            message: `Admin ${req.user.id} baniu o usuário ${id}`,
            userId: req.user.id,
            metadata: { bannedUserId: id },
        });
        res.status(200).json({ message: 'User banned successfully' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const createInvite = async (req: AuthRequest, res: Response) => {
    try {
        const { planId } = req.body; // e.g., 'free', 'pro'
        const userId = req.user.id;

        const invite = await adminService.generateInvite(planId || 'free', userId);
        eventLogService.logEvent({
            type: 'admin.invite_created',
            severity: 'info',
            message: `Admin ${userId} criou convite (plano ${planId || 'free'})`,
            userId,
            metadata: { planId: planId || 'free', inviteCode: invite.code },
        });

        // Return full link format
        // Return full link format
        const link = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/signup?invite=${invite.code}`;

        res.status(201).json({
            invite,
            link
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const getLogs = async (req: AuthRequest, res: Response) => {
    try {
        const severity = req.query.severity as string | undefined;
        const type = req.query.type as string | undefined;
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 50;

        const logs = await adminService.getSystemLogs({ severity, type, page, limit });
        res.status(200).json(logs);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const getFinance = async (req: AuthRequest, res: Response) => {
    try {
        const now = new Date();
        const defaultStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        const defaultEnd = now.toISOString();

        const startDate = (req.query.startDate as string) || defaultStart;
        const endDate = (req.query.endDate as string) || defaultEnd;

        const overview = await adminService.getFinanceOverview(startDate, endDate);
        res.status(200).json(overview);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};
