import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
async function startServer() {
    const server = new Server({
        name: 'twitter-mcp-server',
        version: '0.0.1',
    }, {
        capabilities: {
            tools: {}
        },
    });
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.log('MCP server started and listening');
}
startServer().catch(console.error);
