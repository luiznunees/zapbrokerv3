"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiClient = exports.ApiClient = void 0;
const axios_1 = __importDefault(require("axios"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const API_BASE_URL = process.env.API_BASE_URL || 'https://api.zapbroker.com';
const API_TOKEN = process.env.ZAPBROKER_API_TOKEN;
class ApiClient {
    client;
    constructor() {
        if (!API_TOKEN) {
            console.warn('⚠️ ZAPBROKER_API_TOKEN is not set in environment variables. Auth might fail.');
        }
        this.client = axios_1.default.create({
            baseURL: API_BASE_URL,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_TOKEN}`
            }
        });
        // Response interceptor for logging and error formatting
        this.client.interceptors.response.use((response) => response, (error) => {
            if (error.response) {
                console.error(`[API Error] ${error.config?.method?.toUpperCase()} ${error.config?.url} - ${error.response.status}`);
                console.error('Response Data:', error.response.data);
            }
            else if (error.request) {
                console.error('[API Error] No response received:', error.message);
            }
            else {
                console.error('[API Error] Request setup failed:', error.message);
            }
            return Promise.reject(error);
        });
    }
    // Generic GET
    async get(url, params) {
        try {
            const response = await this.client.get(url, { params });
            // Handle inconsistent backend responses (sometimes wrapped in data, sometimes not)
            // Adjust based on actual backend structure. Assuming consistency for now.
            return response.data;
        }
        catch (error) {
            throw this.formatError(error);
        }
    }
    // Generic POST
    async post(url, data) {
        try {
            const response = await this.client.post(url, data);
            return response.data;
        }
        catch (error) {
            throw this.formatError(error);
        }
    }
    formatError(error) {
        if (axios_1.default.isAxiosError(error)) {
            const message = error.response?.data?.message || error.response?.data?.error || error.message;
            return new Error(`ZapBroker API Error: ${message}`);
        }
        return error instanceof Error ? error : new Error('Unknown API Error');
    }
}
exports.ApiClient = ApiClient;
exports.apiClient = new ApiClient();
