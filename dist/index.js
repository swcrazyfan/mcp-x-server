import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { ListToolsRequestSchema, CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { getTwitterClient } from './twitterClient.js';
function assertPostTweetArgs(args) {
    if (typeof args !== 'object' || args === null) {
        throw new Error('Invalid arguments: expected object');
    }
    if (!('text' in args) || typeof args.text !== 'string') {
        throw new Error('Invalid arguments: expected text string');
    }
}
function assertSearchTweetsArgs(args) {
    if (typeof args !== 'object' || args === null) {
        throw new Error('Invalid arguments: expected object');
    }
    if (!('query' in args) || typeof args.query !== 'string') {
        throw new Error('Invalid arguments: expected query string');
    }
}
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
    server.setRequestHandler(CallToolRequestSchema, async (request) => {
        const client = getTwitterClient();
        if (request.params.name === 'postTweet') {
            assertPostTweetArgs(request.params.arguments);
            const tweet = await client.v2.tweet(request.params.arguments.text);
            return {
                content: [{ type: 'text', text: `Tweet posted with id: ${tweet.data.id}` }],
            };
        }
        if (request.params.name === 'searchTweets') {
            assertSearchTweetsArgs(request.params.arguments);
            const tweets = await client.v2.search(request.params.arguments.query);
            return {
                content: [{
                        type: 'text',
                        text: `Search results: ${JSON.stringify(tweets.data, null, 2)}`
                    }],
            };
        }
        throw new Error(`Tool not found: ${request.params.name}`);
    });
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.log('MCP server started and listening');
}
startServer().catch(console.error);
