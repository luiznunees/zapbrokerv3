"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tools = void 0;
const client_1 = require("../api/client");
exports.tools = {
    // CAMPAIGNS
    create_campaign: async (args) => {
        try {
            const result = await client_1.apiClient.post('/api/campaigns', args);
            return {
                content: [{ type: "text", text: `Campanha '${result.name}' criada com sucesso! ID: ${result.id}` }]
            };
        }
        catch (error) {
            return { isError: true, content: [{ type: "text", text: `Erro ao criar campanha: ${error.message}` }] };
        }
    },
    list_campaigns: async () => {
        try {
            const campaigns = await client_1.apiClient.get('/api/campaigns');
            if (!campaigns || campaigns.length === 0) {
                return { content: [{ type: "text", text: "Você ainda não possui campanhas." }] };
            }
            const formatted = campaigns.map(c => `- [${c.id}] ${c.name} (${c.status})`).join('\n');
            return { content: [{ type: "text", text: `Suas campanhas:\n${formatted}` }] };
        }
        catch (error) {
            return { isError: true, content: [{ type: "text", text: `Erro ao listar campanhas: ${error.message}` }] };
        }
    },
    get_campaign_status: async (args) => {
        try {
            const campaign = await client_1.apiClient.get(`/api/campaigns/${args.id}`);
            return {
                content: [{ type: "text", text: `Status da campanha '${campaign.name}': ${campaign.status.toUpperCase()}` }]
            };
        }
        catch (error) {
            return { isError: true, content: [{ type: "text", text: `Erro ao buscar status: ${error.message}` }] };
        }
    },
    schedule_campaign: async (args) => {
        try {
            // Assuming backend accepts scheduledAt in the body
            const result = await client_1.apiClient.post('/api/campaigns', { ...args, scheduledAt: args.date });
            return {
                content: [{ type: "text", text: `Campanha '${result.name}' agendada para ${args.date}. ID: ${result.id}` }]
            };
        }
        catch (error) {
            return { isError: true, content: [{ type: "text", text: `Erro ao agendar campanha: ${error.message}` }] };
        }
    },
    // CONTACTS
    add_contact: async (args) => {
        try {
            const result = await client_1.apiClient.post('/api/contacts', args);
            return {
                content: [{ type: "text", text: `Contato ${result.name} adicionado com sucesso.` }]
            };
        }
        catch (error) {
            return { isError: true, content: [{ type: "text", text: `Erro ao adicionar contato: ${error.message}` }] };
        }
    },
    list_contacts: async () => {
        try {
            const contacts = await client_1.apiClient.get('/api/contacts');
            if (!contacts || contacts.length === 0) {
                return { content: [{ type: "text", text: "Nenhum contato encontrado." }] };
            }
            const formatted = contacts.slice(0, 20).map(c => `- ${c.name} (${c.whatsapp})`).join('\n');
            const more = contacts.length > 20 ? `\n... e mais ${contacts.length - 20} contatos.` : '';
            return { content: [{ type: "text", text: `Lista de contatos:\n${formatted}${more}` }] };
        }
        catch (error) {
            return { isError: true, content: [{ type: "text", text: `Erro ao listar contatos: ${error.message}` }] };
        }
    },
    create_tag: async (args) => {
        try {
            await client_1.apiClient.post('/api/contacts/tags', args);
            return { content: [{ type: "text", text: `Tag '${args.name}' criada com sucesso.` }] };
        }
        catch (error) {
            return { isError: true, content: [{ type: "text", text: `Erro ao criar tag: ${error.message}` }] };
        }
    }
};
