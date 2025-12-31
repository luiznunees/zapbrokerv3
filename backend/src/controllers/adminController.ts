import { Request, Response } from 'express';
import * as adminService from '../services/adminService';
import { AuthRequest } from '../middlewares/authMiddleware';

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
        const logs = await adminService.getSystemLogs();
        res.status(200).json(logs);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};
