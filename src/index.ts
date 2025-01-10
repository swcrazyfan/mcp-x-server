import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { ListToolsRequestSchema, CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { getTwitterClient } from './twitterClient.js';

interface PostTweetArgs {
    text: string;
}

interface SearchTweetsArgs {
    query: string;
}

function assertPostTweetArgs(args: unknown): asserts args is PostTweetArgs {
    if (typeof args !== 'object' || args === null) {
        throw new Error('Invalid arguments: expected object');
    }
    if (!('text' in args) || typeof (args as any).text !== 'string') {
        throw new Error('Invalid arguments: expected text string');
    }
}

function assertSearchTweetsArgs(args: unknown): asserts args is SearchTweetsArgs {
    if (typeof args !== 'object' || args === null) {
        throw new Error('Invalid arguments: expected object');
    }
    if (!('query' in args) || typeof (args as any).query !== 'string') {
        throw new Error('Invalid arguments: expected query string');
    }
}

const TOOLS = {
    postTweet: {
        description: 'Post a tweet to Twitter',
        inputSchema: {
            type: 'object',
            properties: {
                text: { type: 'string', description: 'The text of the tweet' },
            },
            required: ['text'],
        },
    },
    searchTweets: {
        description: 'Search for tweets on Twitter',
        inputSchema: {
            type: 'object',
            properties: {
                query: { type: 'string', description: 'The query to search for' },
            },
            required: ['query'],
        },
    },
};

async function startServer(): Promise<void> {
    try {
        const server = new Server({
            name: 'twitter-mcp-server',
            version: '0.0.1',
        }, {
            capabilities: {
                tools: TOOLS
            },
        });

        server.setRequestHandler(ListToolsRequestSchema, async () => {
            console.log('Received ListTools request');
            return {
                tools: Object.entries(TOOLS).map(([name, tool]) => ({
                    name,
                    ...tool
                })),
            };
        });

        server.setRequestHandler(CallToolRequestSchema, async (request) => {
            console.log(`Received CallTool request for: ${request.params.name}`);
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
        console.log('Connecting to transport...');
        await server.connect(transport);
        console.log('MCP server started and listening');
    } catch (error) {
        console.error('Server startup error:', error instanceof Error ? error.message : String(error));
        // Don't throw the error, just log it
        // This prevents the process from exiting on initial connection issues
    }
}

// Start server and handle any uncaught errors
startServer().catch((error) => {
    console.error('Uncaught server error:', error instanceof Error ? error.message : String(error));
    // Don't exit on uncaught errors
}); 