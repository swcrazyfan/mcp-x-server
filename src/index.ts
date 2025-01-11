import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { ListToolsRequestSchema, CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { getTwitterClient } from './twitterClient.js';
import { TOOLS } from './tools.js';
import {
    handlePostTweet,
    handlePostTweetWithMedia
} from './handlers/tweet.handlers.js';
import {
    handleGetUserInfo,
    handleGetUserTimeline,
    handleFollowUser,
    handleUnfollowUser
} from './handlers/user.handlers.js';
import {
    handleLikeTweet,
    handleUnlikeTweet,
    handleRetweet,
    handleUndoRetweet
} from './handlers/engagement.handlers.js';
import {
    handleCreateList,
    handleAddUserToList,
    handleRemoveUserFromList,
    handleGetListMembers
} from './handlers/list.handlers.js';

const server = new Server({
    name: 'twitter-mcp-server',
    version: '0.0.1',
}, {
    capabilities: {
        tools: TOOLS
    }
});

server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: Object.entries(TOOLS).map(([name, tool]) => ({
        name,
        ...tool
    }))
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const client = getTwitterClient();

    switch (request.params.name) {
        case 'postTweet':
            return handlePostTweet(client, request.params.arguments);
        
        case 'postTweetWithMedia':
            return handlePostTweetWithMedia(client, request.params.arguments);
        
        case 'getUserInfo':
            return handleGetUserInfo(client, request.params.arguments);
        
        case 'getUserTimeline':
            return handleGetUserTimeline(client, request.params.arguments);
        
        case 'followUser':
            return handleFollowUser(client, request.params.arguments);
        
        case 'unfollowUser':
            return handleUnfollowUser(client, request.params.arguments);
        
        case 'likeTweet':
            return handleLikeTweet(client, request.params.arguments);
        
        case 'unlikeTweet':
            return handleUnlikeTweet(client, request.params.arguments);
        
        case 'retweet':
            return handleRetweet(client, request.params.arguments);
        
        case 'undoRetweet':
            return handleUndoRetweet(client, request.params.arguments);
        
        case 'createList':
            return handleCreateList(client, request.params.arguments);
        
        case 'addUserToList':
            return handleAddUserToList(client, request.params.arguments);
        
        case 'removeUserFromList':
            return handleRemoveUserFromList(client, request.params.arguments);
        
        case 'getListMembers':
            return handleGetListMembers(client, request.params.arguments);
        
        default:
            throw new Error(`Tool not found: ${request.params.name}`);
    }
});

const transport = new StdioServerTransport();
server.connect(transport).catch(console.error); 