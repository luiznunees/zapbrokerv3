import { Request, Response } from 'express';
import * as instanceService from '../services/instanceService';
import { AuthRequest } from '../middlewares/authMiddleware';

export const connect = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user.id;
        const { instanceName } = req.body;

        let instance = await instanceService.getInstanceByName(userId, instanceName);

        if (!instance) {
            // Auto-create if not exists (legacy behavior might expect this?)
            // Or return error. Let's try to create.
            instance = await instanceService.createInstance(userId, instanceName);
        }

        const result = await instanceService.connectInstance(userId, instance.id);
        res.status(200).json(result);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const getStatus = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user.id;
        const { instanceName } = req.query;

        if (!instanceName) throw new Error('Instance name required');

        const instance = await instanceService.getInstanceByName(userId, instanceName as string);

        if (!instance) {
            return res.status(404).json({ status: 'not_found' });
        }

        // We might want to sync status here?
        // getInstances already syncs.
        // Let's just return the DB status mapped to what frontend expects.
        // Frontend expects: { status: 'CONNECTED' | ... }
        // My DB has: 'connected', 'disconnected', 'connecting'

        const statusMap: any = {
            'connected': 'CONNECTED',
            'disconnected': 'DISCONNECTED',
            'connecting': 'CONNECTING',
            'error': 'DISCONNECTED'
        };

        res.status(200).json({ status: statusMap[instance.status] || 'DISCONNECTED' });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const logout = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user.id;
        const { instanceName } = req.body;

        const instance = await instanceService.getInstanceByName(userId, instanceName);

        if (!instance) {
            throw new Error('Instance not found');
        }

        await instanceService.logoutInstance(userId, instance.id);
        res.status(200).json({ success: true });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const listInstances = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user.id;
        const instances = await instanceService.getInstances(userId);

        // Map to legacy format if needed
        // Frontend expects array of objects.
        // My instances have { name, status, ... }
        // Frontend DispatchPage.tsx uses: instanceName, status, owner

        const mapped = instances.map(i => ({
            instanceName: i.name,
            status: i.status === 'connected' ? 'CONNECTED' : 'DISCONNECTED', // Simple mapping
            owner: userId
        }));

        res.status(200).json(mapped);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const testMessage = async (req: AuthRequest, res: Response) => {
    // Implement if needed, calling campaignWorker logic or wahaService directly
    res.status(501).json({ error: 'Not implemented' });
};
