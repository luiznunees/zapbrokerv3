import { Request, Response } from 'express';
import * as dedicatedNumberService from '../services/dedicatedNumberService';
import { AuthRequest } from '../middlewares/authMiddleware';

export const createCheckout = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user.id;
        const { areaCode, cpf, cellphone } = req.body;

        if (!areaCode || typeof areaCode !== 'number') {
            return res.status(400).json({ error: 'areaCode é obrigatório' });
        }
        if (!cpf || !cellphone) {
            return res.status(400).json({ error: 'CPF e telefone são obrigatórios para pagamento via PIX' });
        }

        const result = await dedicatedNumberService.createDedicatedNumberCheckout(userId, areaCode, {
            name: req.user.nome || req.user.email || 'Corretor',
            email: req.user.email || '',
            cellphone,
            taxId: cpf,
        });
        res.status(201).json(result);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const checkoutStatus = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const result = await dedicatedNumberService.checkDedicatedNumberCheckoutStatus(userId, id);
        res.status(200).json(result);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const list = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user.id;
        const result = await dedicatedNumberService.getDedicatedNumbers(userId);
        res.status(200).json(result);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const remove = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const result = await dedicatedNumberService.cancelDedicatedNumber(userId, id);
        res.status(200).json(result);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const sms = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const result = await dedicatedNumberService.getSmsMessages(userId, id);
        res.status(200).json(result);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const areaCodes = async (req: AuthRequest, res: Response) => {
    try {
        const result = await dedicatedNumberService.listAreaCodes();
        res.status(200).json(result);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const getById = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const result = await dedicatedNumberService.getDedicatedNumberById(userId, id);
        res.status(200).json(result);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

// Teste de ponta a ponta: só existe no sandbox da Salvy. Simula um SMS
// chegando no número e dispara o webhook sms.received de verdade.
export const simulateSms = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const { rawText } = req.body;

        if (!rawText || !rawText.trim()) {
            return res.status(400).json({ error: 'rawText é obrigatório (conteúdo do SMS)' });
        }

        const result = await dedicatedNumberService.simulateSmsReceipt(userId, id, rawText);
        res.status(200).json(result);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};