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
        deleteAccount: () => fetchAPI('/auth/account', { method: 'DELETE' }),
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
        listWithCounts: () => fetchAPI('/contact-lists?withCounts=1'),
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
    uploads: {
        media: (formData: FormData) => fetchAPI('/uploads/media', {
            method: 'POST',
            body: formData
        }),
    },
    campaigns: {
        list: () => fetchAPI('/campaigns'),
        getStalledCount: () => fetchAPI('/campaigns/stalled-count'),
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
    payments: {
        createSubscription: (planId: string, data?: any) =>
            fetchAPI('/payments/subscribe', {
                method: 'POST',
                body: JSON.stringify({ planId, ...data })
            }),
        getSubscriptionStatus: (subscriptionId: string) =>
            fetchAPI(`/payments/subscription/${subscriptionId}`),
        checkPaymentNow: (subscriptionId: string) =>
            fetchAPI(`/payments/subscription/${subscriptionId}/check-now`, { method: 'POST' }),
    },
    admin: {
        stats: () => fetchAPI('/admin/stats'),
        getUsers: (page = 1, search = '') => fetchAPI(`/admin/users?page=${page}&search=${search}`),
        banUser: (id: string) => fetchAPI(`/admin/users/${id}/ban`, { method: 'POST' }),
        createInvite: (planId: string) => fetchAPI('/admin/invites', { method: 'POST', body: JSON.stringify({ planId }) }),
        logs: (severity?: string) => {
            const params = new URLSearchParams()
            if (severity) params.set('severity', severity)
            const qs = params.toString()
            return fetchAPI(`/admin/logs${qs ? `?${qs}` : ''}`)
        },
        finance: (startDate?: string, endDate?: string) => {
            const params = new URLSearchParams()
            if (startDate) params.set('startDate', startDate)
            if (endDate) params.set('endDate', endDate)
            const qs = params.toString()
            return fetchAPI(`/admin/finance${qs ? `?${qs}` : ''}`)
        },
        aiCredits: () => fetchAPI('/admin/ai-credits'),
    },
    sessions: {
        list: () => fetchAPI('/agent/sessions'),
        create: (title?: string) => fetchAPI('/agent/sessions', {
            method: 'POST',
            body: JSON.stringify({ title })
        }),
        delete: (id: string) => fetchAPI(`/agent/sessions/${id}`, { method: 'DELETE' }),
        getMessages: (id: string) => fetchAPI(`/agent/sessions/${id}/messages`),
    },
    agent: {
        chat: (message: string, sessionId?: string) => fetchAPI('/agent/chat', {
            method: 'POST',
            body: JSON.stringify({ message, sessionId })
        }),
        chatStream: async (message: string, sessionId: string | undefined, onToken: (token: string) => void, onReset?: () => void): Promise<any> => {
            const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null

            const response = await fetch(`${API_BASE_URL}/agent/chat/stream`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({ message, sessionId }),
            })

            if (!response.ok || !response.body) {
                throw new Error('Falha ao conectar com o agente.')
            }

            const reader = response.body.getReader()
            const decoder = new TextDecoder()
            let buffer = ''
            let result: any = null

            while (true) {
                const { value, done } = await reader.read()
                if (done) break
                buffer += decoder.decode(value, { stream: true })

                const chunks = buffer.split('\n\n')
                buffer = chunks.pop() || ''

                for (const chunk of chunks) {
                    const eventMatch = chunk.match(/^event: (.+)$/m)
                    const dataMatch = chunk.match(/^data: (.+)$/m)
                    if (!dataMatch) continue

                    const event = eventMatch?.[1] || 'message'
                    const data = JSON.parse(dataMatch[1])

                    if (event === 'token') {
                        onToken(data.token)
                    } else if (event === 'reset') {
                        onReset?.()
                    } else if (event === 'done') {
                        result = data
                    } else if (event === 'error') {
                        throw new Error(data.error || 'Erro no agente.')
                    }
                }
            }

            if (!result) throw new Error('O agente não retornou uma resposta completa.')
            return result
        },
        execute: (actionType: string, data?: any) => fetchAPI('/agent/execute', {
            method: 'POST',
            body: JSON.stringify({ actionType, data })
        }),
        suggestions: () => fetchAPI('/agent/suggestions'),
    },
    // Generic methods to support legacy/direct usage (e.g. api.get('/...'))
    get: (endpoint: string, options?: RequestInit) => fetchAPI(endpoint, { ...options, method: 'GET' }),
    post: (endpoint: string, body: any, options: RequestInit = {}) => {
        const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
        return fetchAPI(endpoint, {
            ...options,
            method: 'POST',
            body: isFormData ? body : JSON.stringify(body)
        });
    },
    put: (endpoint: string, body: any, options: RequestInit = {}) => {
        const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
        return fetchAPI(endpoint, {
            ...options,
            method: 'PUT',
            body: isFormData ? body : JSON.stringify(body)
        });
    },
    delete: (endpoint: string, options?: RequestInit) => fetchAPI(endpoint, { ...options, method: 'DELETE' }),
    patch: (endpoint: string, body: any, options: RequestInit = {}) => {
        const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
        return fetchAPI(endpoint, {
            ...options,
            method: 'PATCH',
            body: isFormData ? body : JSON.stringify(body)
        });
    },
};
