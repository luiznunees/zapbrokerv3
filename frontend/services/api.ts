export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';


export async function fetchAPI(endpoint: string, options: RequestInit = {}) {
    const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

    const isFormData = options.body instanceof FormData;

    const headers: any = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    if (isFormData || headers['Content-Type'] === undefined) {
        delete headers['Content-Type'];
    }

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        console.log('🔑 Sending request with token to:', endpoint);
    } else {
        console.log('⚠️ No token available for:', endpoint);
    }

    const response = await fetch(url, {
        ...options,
        headers,
    });

    if (!response.ok) {
        // Handle 401/403 Unauthorized/Forbidden
        if (response.status === 401 || response.status === 403) {
            console.error('🚫 Auth failed for:', endpoint, 'Status:', response.status);
            console.warn('Unauthorized access - token invalid or expired');

            // Only redirect in production, not in development
            if (typeof window !== 'undefined' && !endpoint.includes('/auth/login')) {
                console.warn('⚠️ Authentication failed. Clearing token and redirecting to login...');
                localStorage.removeItem('token');
                window.location.href = '/login';
            }
        }
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody.message || errorBody.error || `API Error: ${response.statusText}`);
    }

    // Handle 204 No Content - don't try to parse JSON
    if (response.status === 204) {
        return null;
    }

    return response.json();
}

// Helper methods for common entities
export const api = {
    auth: {
        login: (data: any) => fetchAPI('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
        register: (data: any) => fetchAPI('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
        me: () => fetchAPI('/auth/me'),
        profile: () => fetchAPI('/auth/me'),
        updateProfile: (data: any) => fetchAPI('/auth/me', { method: 'PUT', body: JSON.stringify(data) }),
        google: async () => {
            const { supabase } = await import('@/lib/supabase');
            return supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/auth/callback`
                }
            });
        },
    },
    instances: {
        list: () => fetchAPI('/instances'),
        create: (name: string) => fetchAPI('/instances', { method: 'POST', body: JSON.stringify({ name }) }),
        connect: (id: string) => fetchAPI(`/instances/${id}/connect`),
        logout: (id: string) => fetchAPI(`/instances/${id}/logout`, { method: 'POST' }),
        delete: (id: string) => fetchAPI(`/instances/${id}`, { method: 'DELETE' }),
    },
    contacts: {
        list: () => fetchAPI('/contact-lists'),
        createList: (name: string) => fetchAPI('/contact-lists', { method: 'POST', body: JSON.stringify({ name }) }),
        updateList: (id: string, name: string) => fetchAPI(`/contact-lists/${id}`, { method: 'PUT', body: JSON.stringify({ name }) }),
        deleteList: (id: string) => fetchAPI(`/contact-lists/${id}`, { method: 'DELETE' }),
        importCsv: (formData: FormData) => fetchAPI('/contact-lists/import-csv', {
            method: 'POST',
            body: formData
        }),
        importPdf: (formData: FormData) => fetchAPI('/contact-lists/import-pdf', {
            method: 'POST',
            body: formData
        }),
        importExcel: (formData: FormData) => fetchAPI('/contact-lists/import-excel', {
            method: 'POST',
            body: formData
        }),
        // CRUD for individual contacts
        getAll: (filters?: { listId?: string }) => {
            const params = new URLSearchParams();
            if (filters?.listId) params.append('listId', filters.listId);
            return fetchAPI(`/api/contatos?${params.toString()}`);
        },
        getCount: () => fetchAPI('/api/contacts/count'),
        create: (data: any) => fetchAPI('/api/contatos', { method: 'POST', body: JSON.stringify(data) }),
        update: (id: string, data: any) => fetchAPI(`/api/contatos/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
        delete: (id: string) => fetchAPI(`/api/contatos/${id}`, { method: 'DELETE' }),
    },
    campaigns: {
        list: () => fetchAPI('/campaigns'),
        getDetails: (id: string) => fetchAPI(`/campaigns/${id}`),
        create: (formData: FormData) => fetchAPI('/campaigns', {
            method: 'POST',
            body: formData
        }),
        getKanban: (campaignId: string) => fetchAPI(`/campaigns/${campaignId}/kanban`),
        updateLeadStatus: (messageId: string, status: string) => fetchAPI(`/campaigns/messages/${messageId}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status })
        }),
        pause: (id: string) => fetchAPI(`/campaigns/${id}/pause`, { method: 'POST' }),
        resume: (id: string) => fetchAPI(`/campaigns/${id}/resume`, { method: 'POST' }),
    },
    quotas: {
        current: () => fetchAPI('/quotas/current'),
        history: () => fetchAPI('/quotas/history'),
    },
    chats: {
        list: () => fetchAPI('/contact-lists/chats'),
        getMessages: (contactId: string) => fetchAPI(`/contact-lists/${contactId}/messages`),
    },
    settings: {
        get: () => fetchAPI('/api/settings'),
        update: (data: any) => fetchAPI('/api/settings', { method: 'PUT', body: JSON.stringify(data) }),
    },
    payments: {
        createSubscription: (planId: string, customer: any) =>
            fetchAPI('/payments/subscribe', {
                method: 'POST',
                body: JSON.stringify({ planId, customer })
            }),
        getSubscriptionStatus: (subscriptionId: string) =>
            fetchAPI(`/payments/subscription/${subscriptionId}`),
    },
};
