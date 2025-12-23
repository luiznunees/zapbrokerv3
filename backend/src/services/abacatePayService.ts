import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const ABACATE_PAY_URL = 'https://api.abacatepay.com/v1';
const ABACATE_PAY_KEY = process.env.ABACATE_PAY_KEY;

if (!ABACATE_PAY_KEY) {
    console.warn('ABACATE_PAY_KEY is missing in .env');
}

const api = axios.create({
    baseURL: ABACATE_PAY_URL,
    headers: {
        'Authorization': `Bearer ${ABACATE_PAY_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
});

interface CustomerData {
    name: string;
    cellphone: string;
    email: string;
    taxId: string; // CPF/CNPJ
}

export const createCustomer = async (data: CustomerData) => {
    try {
        const response = await api.post('/customer/create', data);
        return response.data.data;
    } catch (error: any) {
        console.error('Error creating AbacatePay customer:', error.response?.data || error.message);
        throw new Error('Failed to create customer');
    }
};

interface PixData {
    amount: number; // in cents
    description?: string;
    customer: CustomerData;
    metadata?: any;
}

export const createPixQrCode = async (data: PixData) => {
    try {
        const sanitizedTaxId = data.customer.taxId.replace(/\D/g, '');
        const sanitizedPhone = data.customer.cellphone.replace(/\D/g, '');

        if (sanitizedTaxId.length !== 11 && sanitizedTaxId.length !== 14) {
            throw new Error('Invalid CPF/CNPJ length. Must be 11 or 14 digits.');
        }

        const payload = {
            amount: data.amount,
            description: data.description,
            customer: {
                ...data.customer,
                taxId: sanitizedTaxId,
                cellphone: sanitizedPhone
            },
            metadata: data.metadata,
            expiresIn: 3600 // 1 hour
        };

        const response = await api.post('/pixQrCode/create', payload);
        return response.data.data;
    } catch (error: any) {
        console.error('Error creating PIX QR Code:', error.response?.data || error.message);
        if (error.response?.data) {
            console.error('AbacatePay Error Details:', JSON.stringify(error.response.data, null, 2));
        }
        throw new Error(`Failed to create PIX QR Code: ${JSON.stringify(error.response?.data || error.message)}`);
    }
};
