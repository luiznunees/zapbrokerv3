"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mcp_js_1 = require("@modelcontextprotocol/sdk/server/mcp.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
const zod_1 = require("zod");
const tools_1 = require("./tools");
const client_1 = require("./api/client");
// Create server instance
const server = new mcp_js_1.McpServer({
    name: "zapbroker-mcp",
    version: "1.0.0",
});
// --- TOOLS REGISTRATION ---
server.tool("create_campaign", "Create a new message blast campaign", {
    name: zod_1.z.string().describe("Name of the campaign"),
    message: zod_1.z.string().describe("Content of the message to send"),
    listId: zod_1.z.string().optional().describe("ID of the contact list to target")
}, tools_1.tools.create_campaign);
server.tool("list_campaigns", "List all campaigns created by the user", {}, tools_1.tools.list_campaigns);
server.tool("get_campaign_status", "Get the status of a specific campaign by ID", {
    id: zod_1.z.string().describe("The UUID of the campaign")
}, tools_1.tools.get_campaign_status);
server.tool("schedule_campaign", "Schedule a campaign for a future date", {
    name: zod_1.z.string(),
    message: zod_1.z.string(),
    date: zod_1.z.string().describe("ISO date string for scheduling"),
    listId: zod_1.z.string().optional()
}, tools_1.tools.schedule_campaign);
server.tool("add_contact", "Add a new contact to the database", {
    name: zod_1.z.string(),
    whatsapp: zod_1.z.string().describe("Phone number with country code (e.g. 5511999999999)"),
    email: zod_1.z.string().optional(),
    tags: zod_1.z.array(zod_1.z.string()).optional()
}, tools_1.tools.add_contact);
server.tool("list_contacts", "List stored contacts", {}, tools_1.tools.list_contacts);
server.tool("create_tag", "Create a new tag to organize contacts", {
    name: zod_1.z.string(),
    color: zod_1.z.string().optional()
}, tools_1.tools.create_tag);
// --- RESOURCES REGISTRATION ---
server.resource("user_quota", "user://quota", async (uri) => {
    try {
        const quota = await client_1.apiClient.get('/api/quotas/current');
        return {
            contents: [{
                    uri: uri.href,
                    text: JSON.stringify(quota, null, 2)
                }]
        };
    }
    catch (error) {
        return {
            contents: [{ uri: uri.href, text: `Error fetching quota: ${error.message}` }]
        };
    }
});
server.resource("contact_list", "contacts://list", async (uri) => {
    try {
        const contacts = await client_1.apiClient.get('/api/contacts');
        return {
            contents: [{
                    uri: uri.href,
                    text: JSON.stringify(contacts, null, 2)
                }]
        };
    }
    catch (error) {
        return { contents: [{ uri: uri.href, text: "Error" }] };
    }
});
// --- START SERVER ---
async function main() {
    const transport = new stdio_js_1.StdioServerTransport();
    await server.connect(transport);
    console.error("ZapBroker MCP Server running on stdio");
}
main().catch((error) => {
    console.error("Fatal error in main():", error);
    process.exit(1);
});
