import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const SALVY_API_URL = 'https://api.salvy.com.br';
const SALVY_API_KEY = process.env.SALVY_API_KEY;

if (!SALVY_API_KEY) {
    console.warn('Warning: Missing SALVY_API_KEY env var');
}

const api = axios.create({
    baseURL: SALVY_API_URL,
    headers: {
        Authorization: `Bearer ${SALVY_API_KEY}`,
        'Content-Type': 'application/json'
    }
});

export interface SalvyNumber {
    id: string;
    name: string | null;
    phoneNumber: string;
    status: 'pending' | 'active' | 'blocked' | 'canceled';
    createdAt: string;
    canceledAt: string | null;
    cancelReason: string | null;
}

export interface SalvySmsMessage {
    id: string;
    phoneNumber: string;
    body: string;
    receivedAt: string;
}

export const createNumber = async (areaCode: number, name?: string, costCenter?: string) => {
    const payload: any = { areaCode };
    if (name) payload.name = name;
    if (costCenter) payload.costCenter = costCenter;

    const response = await api.post('/api/v2/virtual-phone-accounts', payload);
    return response.data as SalvyNumber;
};

export const listNumbers = async () => {
    const response = await api.get('/api/v2/virtual-phone-accounts');
    return response.data as SalvyNumber[];
};

export const getNumber = async (salvyId: string) => {
    const response = await api.get(`/api/v2/virtual-phone-accounts/${salvyId}`);
    return response.data as SalvyNumber;
};

export const cancelNumber = async (salvyId: string, reason?: string) => {
    const params = reason ? { reason } : undefined;
    const response = await api.delete(`/api/v2/virtual-phone-accounts/${salvyId}`, { params });
    return response.data;
};

export const listAreaCodes = async (availableOnly = true) => {
    const response = await api.get('/api/v2/virtual-phone-accounts/area-codes', {
        params: availableOnly ? { available: 'true' } : undefined,
    });
    return response.data;
};

// Retorna todos os DDDs com o flag de disponibilidade, para a UI mostrar
// quais estão disponíveis e sinalizar quando o digitado não está.
export const listAreaCodesWithAvailability = async () => {
    const response = await api.get('/api/v2/virtual-phone-accounts/area-codes');
    return response.data;
};

export const listSmsMessages = async (salvyId: string) => {
    const response = await api.get(`/api/v2/virtual-phone-accounts/${salvyId}/sms`);
    return response.data as SalvySmsMessage[];
};

// Simula o recebimento de um SMS em uma linha virtual. Disponível apenas no
// ambiente sandbox. A Salvy dispara o webhook sms.received normalmente.
export const simulateSms = async (salvyId: string, rawText: string, originPhoneNumber = '23456') => {
    const response = await api.post(
        `/api/v2/virtual-phone-accounts/${salvyId}/sms`,
        { rawText, originPhoneNumber }
    );
    return response.data;
};