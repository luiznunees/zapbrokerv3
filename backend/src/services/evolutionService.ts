import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || 'http://localhost:8080';
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY;

if (!EVOLUTION_API_KEY) {
    console.warn('Warning: Missing EVOLUTION_API_KEY env var');
}

const api = axios.create({
    baseURL: EVOLUTION_API_URL,
    headers: {
        'apikey': EVOLUTION_API_KEY,
        'Content-Type': 'application/json'
    }
});

export const createSession = async (instanceName: string) => {
    try {
        // Evolution v2: POST /instance/create
        const payload = {
            instanceName: instanceName,
            token: instanceName, // Using name as token for simplicity
            qrcode: true,
            integration: "WHATSAPP-BAILEYS"
        };

        console.log('Creating Evolution instance:', instanceName);
        const response = await api.post('/instance/create', payload);
        return response.data;
    } catch (error: any) {
        if (error.response?.data?.error === 'Instance already exists' ||
            error.response?.data?.response?.message?.includes('already exists')) {
            console.log(`Instance ${instanceName} already exists in Evolution.`);
            return { instance: { instanceName: instanceName } };
        }
        console.error('Error creating Evolution instance:', error.response?.data || error.message);
        throw new Error('Failed to create WhatsApp instance');
    }
};

export const startSession = async (instanceName: string) => {
    // Evolution instances start automatically or via restart
    // No explicit "start" endpoint like WAHA needed often, but we can check connection
    return { status: 'started' };
};

export const getSessionScreen = async (instanceName: string) => {
    try {
        // GET /instance/connect/{instance}
        const response = await api.get(`/instance/connect/${instanceName}`);
        // Evolution returns { base64: "..." } or { qrcode: { base64: "..." } }
        const base64 = response.data.base64 || response.data.qrcode?.base64;
        return base64;
    } catch (error: any) {
        console.error('Error getting Evolution QR:', error.response?.data || error.message);
        return null;
    }
};

export const checkSessionStatus = async (instanceName: string) => {
    try {
        // GET /instance/connectionState/{instance}
        const response = await api.get(`/instance/connectionState/${instanceName}`);
        // Returns { instance: { state: "open" | "close" | "connecting" } }
        return response.data.instance?.state || 'close';
    } catch (error: any) {
        if (error.response?.status === 404) {
            return 'not_found';
        }
        console.error('Error checking Evolution status:', error.response?.data || error.message);
        return 'error';
    }
};

export const sendText = async (instanceName: string, chatId: string, text: string) => {
    try {
        const payload = {
            number: chatId.replace('@c.us', ''), // Evolution usually takes pure numbers
            text: text,
            options: {
                delay: 1200
            }
        };

        console.log(`[EvolutionService] POST /message/sendText/${instanceName}`, payload);
        const response = await api.post(`/message/sendText/${instanceName}`, payload);
        console.log(`[EvolutionService] Response:`, response.data);
        return response.data;
    } catch (error: any) {
        console.error('Error sending text via Evolution:', error.response?.data || error.message);
        throw new Error('Failed to send text message');
    }
};

export const sendImage = async (instanceName: string, chatId: string, file: { media: string, caption?: string, mimetype: string, filename: string }) => {
    try {
        const payload = {
            number: chatId.replace('@c.us', ''),
            mediatype: "image",
            mimetype: file.mimetype,
            caption: file.caption || "",
            media: file.media,
            fileName: file.filename
        };

        const response = await api.post(`/message/sendMedia/${instanceName}`, payload);
        return response.data;
    } catch (error: any) {
        console.error('Error sending image via Evolution:', error.response?.data || error.message);
        throw new Error('Failed to send image');
    }
};

export const logoutSession = async (instanceName: string) => {
    try {
        await api.delete(`/instance/logout/${instanceName}`);
    } catch (error: any) {
        console.error('Error logging out Evolution:', error.response?.data || error.message);
    }
};

export const deleteSession = async (instanceName: string) => {
    try {
        await api.delete(`/instance/delete/${instanceName}`);
    } catch (error: any) {
        console.error('Error deleting Evolution instance:', error.response?.data || error.message);
    }
};
export const fetchProfile = async (instanceName: string, number: string) => {
    try {
        const payload = {
            number: number.replace(/\D/g, '')
        };
        const response = await api.post(`/chat/fetchProfile/${instanceName}`, payload);
        return response.data;
    } catch (error: any) {
        console.error('Error fetching profile via Evolution:', error.response?.data || error.message);
        return null;
    }
};
