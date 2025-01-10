import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
async function startServer() {
    const server = new Server({
        name: 'twitter-mcp-server',
        version: '0.0.1',
    }, {
        capabilities: {
            tools: {}
        },
    });
    server.setRequestHandler(ListToolsRequestSchema, async () => {
        return {
            tools: [
                {
                    name: 'postTweet',
                    description: 'Post a tweet to Twitter',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            text: { type: 'string', description: 'The text of the tweet' },
                        },
                        required: ['text'],
                    },
                },
                {
                    name: 'searchTweets',
                    description: 'Search for tweets on Twitter',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            query: { type: 'string', description: 'The query to search for' },
                        },
                        required: ['query'],
                    },
                },
            ],
        };
    });
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.log('MCP server started and listening');
}
startServer().catch(console.error);
