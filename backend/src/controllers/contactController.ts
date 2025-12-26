import { Request, Response } from 'express';
import * as contactService from '../services/contactService';
import { AuthRequest } from '../middlewares/authMiddleware';

export const createList = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user.id;
        const { name } = req.body;
        const result = await contactService.createList(userId, name);
        res.status(201).json(result);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const getLists = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user.id;
        const result = await contactService.getLists(userId);
        res.status(200).json(result);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const addContact = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user.id;
        const { listId } = req.params;
        const { name, phone } = req.body;
        const result = await contactService.addContact(userId, listId, name, phone);
        res.status(201).json(result);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const importContacts = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user.id;
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const result = await contactService.importContactsFromCsv(userId, req.file.path, req.file.originalname);
        res.status(200).json(result);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const importPdf = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user.id;
        if (!req.file) {
            return res.status(400).json({ error: 'No PDF file uploaded' });
        }

        // originalname is from multer
        const result = await contactService.importContactsFromPdf(userId, req.file.path, req.file.originalname);
        res.status(200).json(result);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const importExcel = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user.id;
        if (!req.file) {
            return res.status(400).json({ error: 'No Excel file uploaded' });
        }

        const result = await contactService.importContactsFromExcel(userId, req.file.path, req.file.originalname);
        res.status(200).json(result);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const getChats = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user.id;
        const result = await contactService.getChats(userId);
        res.status(200).json(result);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const getMessages = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user.id;
        const { contactId } = req.params;
        const result = await contactService.getMessages(userId, contactId);
        res.status(200).json(result);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const getAllContacts = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user.id;
        const filters = req.query;
        const result = await contactService.getAllContacts(userId, filters);
        res.status(200).json(result);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const createContact = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user.id;
        const { name, phone, categoriaId, tags } = req.body;

        // If no list provided, try to find a default list or create one?
        // For now, let's assume listId (categoriaId) is required or we pick the first one.
        let listId = categoriaId;

        if (!listId) {
            const lists = await contactService.getLists(userId);
            if (lists && lists.length > 0) {
                listId = lists[0].id;
            } else {
                const newList = await contactService.createList(userId, 'Geral');
                listId = newList.id;
            }
        }

        const result = await contactService.addContact(userId, listId, name, phone);
        res.status(201).json(result);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const updateContact = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const updates = req.body;
        const result = await contactService.updateContact(userId, id, updates);
        res.status(200).json(result);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const deleteContact = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        await contactService.deleteContact(userId, id);
        res.status(204).send();
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const updateList = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user.id;
        const { listId } = req.params;
        const { name } = req.body;
        const result = await contactService.updateList(userId, listId, name);
        res.status(200).json(result);
    } catch (error: any) {
        console.error('[ContactController] updateList error:', error.message);
        res.status(400).json({ error: error.message });
    }
};

export const deleteList = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user.id;
        const { listId } = req.params;
        await contactService.deleteList(userId, listId);
        res.status(204).send();
    } catch (error: any) {
        console.error('[ContactController] deleteList error:', error.message);
        res.status(400).json({ error: error.message });
    }
};

export const getContactsCount = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user.id;
        const result = await contactService.getContactsCount(userId);
        res.status(200).json(result);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};
