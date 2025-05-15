import { McpServer as Server } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
// ListToolsRequestSchema and CallToolRequestSchema are not directly used with server.tool, so commenting out unless needed elsewhere
// import { ListToolsRequestSchema, CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { TwitterClient as ApiV2Client } from './client/twitter.js';
import { TwikitBridgeClient } from './client/twikitBridgeClient.js';
import { TOOLS } from './tools.js';
import { config } from 'dotenv';
import { execSync } from 'child_process';
import { existsSync } from 'fs';
import path from 'path';
import { TTweetv2Expansion, TTweetv2UserField, TTweetv2TweetField } from 'twitter-api-v2';
import {
    handlePostTweet,
    handlePostTweetWithMedia,
    handleGetTweetById,
    handleReplyToTweet,
    handleDeleteTweet,
    handleGetUserTimeline
} from './handlers/tweet.handlers.js';
import {
    handleLikeTweet,
    handleUnlikeTweet,
    handleRetweet,
    handleUndoRetweet,
    handleGetRetweets,
    handleGetLikedTweets
} from './handlers/engagement.handlers.js';
import {
    handleGetUserInfo,
    handleFollowUser,
    handleUnfollowUser,
    handleGetFollowers,
    handleGetFollowing
} from './handlers/user.handlers.js';
import {
    handleCreateList,
    handleAddUserToList,
    handleRemoveUserFromList,
    handleGetListMembers,
    handleGetUserLists
} from './handlers/list.handlers.js';
import {
    handleSearchTweets,
    handleHashtagAnalytics
} from './handlers/search.handlers.js';
import { GetUserTimelineArgs } from './types/handlers.js';
import { z } from 'zod';

// Load environment variables
config();

const server = new Server({
    name: 'twitter-mcp-server',
    version: '0.0.1'
});

// Initialize Twitter client based on mode
let activeTwitterClient: ApiV2Client | TwikitBridgeClient;
let twikitBridge: TwikitBridgeClient | null = null;

const mode = process.env.MCP_TWITTER_MODE || 'API';

// Define paths for Python bridge
const projectRoot = process.cwd(); // Assuming script is run from project root
const pythonBridgeDir = path.join(projectRoot, 'python_bridge');
const venvDir = path.join(pythonBridgeDir, '.venv');
const requirementsPath = path.join(pythonBridgeDir, 'requirements.txt');
let pythonExecutable = 'python3'; // Default, can be platform-dependent

// Determine platform-specific Python executable within venv
if (process.platform === 'win32') {
    pythonExecutable = path.join(venvDir, 'Scripts', 'python.exe');
} else {
    pythonExecutable = path.join(venvDir, 'bin', 'python');
}
const pipExecutable = process.platform === 'win32' ? path.join(venvDir, 'Scripts', 'pip.exe') : path.join(venvDir, 'bin', 'pip');

async function setupPythonEnvironment() {
    console.log('[MCP Server] Setting up Python environment for Twikit mode...');

    // 1. Check for system Python (python3)
    try {
        execSync('python3 --version'); // Or use a more specific check if needed
        console.log('[MCP Server] System python3 found.');
    } catch (error) {
        console.error('[MCP Server] ERROR: python3 is not found in PATH. Cannot set up Twikit environment.', error);
        throw new Error('python3 not found');
    }

    // 2. Create virtual environment if it doesn't exist
    if (!existsSync(venvDir)) {
        console.log(`[MCP Server] Virtual environment not found at ${venvDir}. Creating...`);
        try {
            execSync(`python3 -m venv ${venvDir}`, { stdio: 'inherit' });
            console.log('[MCP Server] Virtual environment created.');
        } catch (error) {
            console.error('[MCP Server] ERROR: Failed to create Python virtual environment.', error);
            throw error;
        }
    } else {
        console.log(`[MCP Server] Virtual environment found at ${venvDir}.`);
    }

    // 3. Install dependencies using pip from the virtual environment
    if (!existsSync(requirementsPath)) {
        console.error(`[MCP Server] ERROR: requirements.txt not found at ${requirementsPath}`);
        throw new Error('requirements.txt not found for Python bridge.');
    }
    console.log(`[MCP Server] Installing/updating dependencies from ${requirementsPath} using ${pipExecutable}...`);
    try {
        execSync(`${pipExecutable} install -r ${requirementsPath}`, { stdio: 'inherit' });
        console.log('[MCP Server] Python dependencies installed/updated.');
    } catch (error) {
        console.error('[MCP Server] ERROR: Failed to install Python dependencies.', error);
        throw error;
    }
    console.log('[MCP Server] Python environment setup complete.');
}

async function initializeClient() {
    if (mode === 'TWIKIT') {
        console.log('[MCP Server] Initializing in TWIKIT mode.');
        try {
            await setupPythonEnvironment();
            // Pass the specific python executable from the venv to the client
            twikitBridge = new TwikitBridgeClient(pythonExecutable);
            await twikitBridge.startService();
            console.log('[MCP Server] TwikitBridgeClient service started successfully.');
            activeTwitterClient = twikitBridge;
        } catch (error) {
            console.error('[MCP Server] Failed to start TwikitBridgeClient service. Falling back to API mode if possible, or exiting.', error);
            // Fallback or critical error handling - for now, let's attempt API mode or throw
            if (process.env.X_API_KEY) {
                console.warn('[MCP Server] Falling back to API mode due to Twikit initialization failure.');
                activeTwitterClient = new ApiV2Client({
                    appKey: process.env.X_API_KEY || '',
                    appSecret: process.env.X_API_SECRET || '',
                    accessToken: process.env.X_ACCESS_TOKEN || '',
                    accessSecret: process.env.X_ACCESS_TOKEN_SECRET || '',
                });
            } else {
                throw new Error('Twikit mode failed and API credentials are not available.');
            }
        }
    } else {
        console.log('[MCP Server] Initializing in API mode.');
        if (!process.env.X_API_KEY || !process.env.X_API_SECRET || !process.env.X_ACCESS_TOKEN || !process.env.X_ACCESS_TOKEN_SECRET) {
            throw new Error('Missing Twitter API v2 credentials for API mode.');
        }
        activeTwitterClient = new ApiV2Client({
            appKey: process.env.X_API_KEY,
            appSecret: process.env.X_API_SECRET,
            accessToken: process.env.X_ACCESS_TOKEN,
            accessSecret: process.env.X_ACCESS_TOKEN_SECRET,
        });
    }
}

// jsonSchemaToZod: Ensure it consistently returns a ZodObject, even z.object({}) for empty/invalid.
function jsonSchemaToZod(jsonSchema: any): z.ZodTypeAny {
    if (!jsonSchema || (typeof jsonSchema === 'object' && Object.keys(jsonSchema).length === 0)) {
        return z.object({});
    }
    if (typeof jsonSchema !== 'object' || typeof jsonSchema.type !== 'string') { 
        console.warn('[jsonSchemaToZod] Invalid schema (not an object or no type string), defaulting to z.object({}):', jsonSchema);
        return z.object({});
    }
    switch (jsonSchema.type) {
        case 'object':
            if (!jsonSchema.properties || typeof jsonSchema.properties !== 'object') { 
                console.warn('[jsonSchemaToZod] Object schema missing or invalid properties, defaulting to z.object({}):', jsonSchema);
                return z.object({}); 
            }
            const shape: Record<string, z.ZodTypeAny> = {};
            const requiredProps = new Set(jsonSchema.required || []);
            for (const key in jsonSchema.properties) {
                const propSchema = jsonSchema.properties[key];
                let zodField = jsonSchemaToZod(propSchema); 
                if (!requiredProps.has(key) || propSchema.optional) {
                    zodField = zodField.optional();
                }
                if (propSchema.description) {
                    zodField = zodField.describe(propSchema.description);
                }
                shape[key] = zodField;
            }
            return z.object(shape);
        case 'string':
            return z.object({ value: jsonSchema.enum ? z.enum(jsonSchema.enum as [string, ...string[]]) : z.string() });
        case 'number':
            let numField = z.number();
            if (jsonSchema.minimum !== undefined) numField = numField.min(jsonSchema.minimum);
            if (jsonSchema.maximum !== undefined) numField = numField.max(jsonSchema.maximum);
            return z.object({ value: numField });
        case 'boolean':
            return z.object({ value: z.boolean() });
        case 'array':
            if (!jsonSchema.items || typeof jsonSchema.items !== 'object') {
                console.warn('[jsonSchemaToZod] Array schema missing or invalid items definition, defaulting to z.object({value: z.array(z.any())}):', jsonSchema);
                return z.object({ value: z.array(z.any()) });
            }
            return z.object({ value: z.array(jsonSchemaToZod(jsonSchema.items)) }); 
        default:
            console.warn('[jsonSchemaToZod] Unknown schema type, defaulting to z.object({}):', jsonSchema.type, jsonSchema);
            return z.object({}); 
    }
}

async function registerTools() {
    if (!activeTwitterClient) {
        console.error("[MCP Server] activeTwitterClient not initialized before registerTools.");
        if(!activeTwitterClient) throw new Error("Client not initialized for tool registration");
    }

    for (const toolName in TOOLS) {
        const toolDefinition = (TOOLS as any)[toolName];
        // jsonSchemaToZod now guarantees a ZodObject (e.g. z.object({}) if inputSchema is empty/undefined)
        const zodSchemaObject = jsonSchemaToZod(toolDefinition.inputSchema);
        let schemaArg: Record<string, z.ZodTypeAny> = {};
        if (zodSchemaObject instanceof z.ZodObject) {
            schemaArg = zodSchemaObject.shape;
        } else {
            // If not a ZodObject, fallback to empty shape
            schemaArg = {};
        }

        const toolHandler = async (args: any) => {
            if (!activeTwitterClient) {
                throw new Error("Twitter client is not available when tool is called.");
            }
            let handlerResponse;
            switch (toolName) {
                case 'postTweet':
                    handlerResponse = await handlePostTweet(activeTwitterClient, args as { text: string });
                    break;
                case 'postTweetWithMedia':
                    handlerResponse = await handlePostTweetWithMedia(activeTwitterClient, args as { text: string; mediaPath: string; mediaType: string; altText?: string });
                    break;
                case 'getTweetById':
                    handlerResponse = await handleGetTweetById(activeTwitterClient, args as { tweetId: string });
                    break;
                case 'replyToTweet':
                    handlerResponse = await handleReplyToTweet(activeTwitterClient, args as { tweetId: string; text: string });
                    break;
                case 'deleteTweet':
                    handlerResponse = await handleDeleteTweet(activeTwitterClient, args as { tweetId: string });
                    break;
                case 'likeTweet':
                    handlerResponse = await handleLikeTweet(activeTwitterClient, args as { tweetId: string });
                    break;
                case 'unlikeTweet':
                    handlerResponse = await handleUnlikeTweet(activeTwitterClient, args as { tweetId: string });
                    break;
                case 'retweet':
                    handlerResponse = await handleRetweet(activeTwitterClient, args as { tweetId: string });
                    break;
                case 'undoRetweet':
                    handlerResponse = await handleUndoRetweet(activeTwitterClient, args as { tweetId: string });
                    break;
                case 'getRetweets':
                    handlerResponse = await handleGetRetweets(activeTwitterClient, args as { tweetId: string; maxResults?: number });
                    break;
                case 'getLikedTweets':
                    handlerResponse = await handleGetLikedTweets(activeTwitterClient, args as { userId: string; maxResults?: number });
                    break;
                case 'getUserInfo':
                    handlerResponse = await handleGetUserInfo(activeTwitterClient, args as { username: string });
                    break;
                case 'getUserTimeline':
                    handlerResponse = await handleGetUserTimeline(activeTwitterClient, args as GetUserTimelineArgs );
                    break;
                case 'followUser':
                    handlerResponse = await handleFollowUser(activeTwitterClient, args as { username: string });
                    break;
                case 'unfollowUser':
                    handlerResponse = await handleUnfollowUser(activeTwitterClient, args as { username: string });
                    break;
                case 'getFollowers':
                    handlerResponse = await handleGetFollowers(activeTwitterClient, args as { username: string; maxResults?: number });
                    break;
                case 'getFollowing':
                    handlerResponse = await handleGetFollowing(activeTwitterClient, args as { username: string; maxResults?: number });
                    break;
                case 'createList':
                    handlerResponse = await handleCreateList(activeTwitterClient, args as { name: string; description?: string; isPrivate?: boolean; });
                    break;
                case 'addUserToList':
                    handlerResponse = await handleAddUserToList(activeTwitterClient, args as { listId: string; userId: string });
                    break;
                case 'removeUserFromList':
                    handlerResponse = await handleRemoveUserFromList(activeTwitterClient, args as { listId: string; userId: string });
                    break;
                case 'getListMembers':
                    handlerResponse = await handleGetListMembers(activeTwitterClient, args as { listId: string; maxResults?: number; userFields?: string[] });
                    break;
                case 'getUserLists':
                    handlerResponse = await handleGetUserLists(activeTwitterClient, args as { username: string; maxResults?: number });
                    break;
                case 'searchTweets':
                    handlerResponse = await handleSearchTweets(activeTwitterClient, args as { query: string; maxResults?: number; searchType?: string; tweetFields?: string[] });
                    break;
                case 'getHashtagAnalytics':
                    handlerResponse = await handleHashtagAnalytics(activeTwitterClient, args as { hashtag: string; startTime?: string; endTime?: string });
                    break;
                default:
                    console.error(`[MCP Server] Tool handler for ${toolName} not implemented.`);
                    return {
                        content: [{ type: 'text' as const, text: `Error: Tool ${toolName} not implemented.` }]
                    };
            }
            return {
                content: [{ type: 'text' as const, text: String(handlerResponse.response) }],
            };
        };

        server.tool(toolName, schemaArg, toolHandler);
        console.log(`[MCP Server] Registered tool: ${toolName}`);
    }
}

// Commented out old setRequestHandler calls
// server.setRequestHandler(ListToolsRequestSchema, async () => ({...}));
// server.setRequestHandler(CallToolRequestSchema, async (request: z.infer<typeof CallToolRequestSchema>) => {...});

const transport = new StdioServerTransport();

async function startServer() {
    try {
        await initializeClient(); // Ensure client is ready
        await registerTools();    // Register tools after client is initialized
        console.log('[MCP Server] Twitter client initialized and tools registered. Connecting to transport...');
        await server.connect(transport);
        console.log('[MCP Server] Server connected to transport. Ready for requests.');
    } catch (error) {
        console.error('[MCP Server] Failed to start server:', error);
        process.exit(1);
    }
}

startServer();

// Graceful shutdown
const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM'];
signals.forEach(signal => {
    process.on(signal, async () => {
        console.log(`[MCP Server] Received ${signal}. Shutting down gracefully...`);
        if (twikitBridge) {
            await twikitBridge.stopService();
            console.log('[MCP Server] TwikitBridgeClient service stopped.');
        }
        // Potentially add server.close() or transport.close() if available and needed
        console.log('[MCP Server] Shutdown complete.');
        process.exit(0);
    });
}); 