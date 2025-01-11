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
import {
    TweetHandlerArgs,
    MediaTweetHandlerArgs,
    UserHandlerArgs,
    ListHandlerArgs,
    ListCreateArgs,
    GetUserInfoArgs,
    GetUserTimelineArgs,
    TweetEngagementArgs,
    ListMemberArgs,
    GetListMembersArgs
} from './types/handlers.js';

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
    const args = request.params.arguments || {};

    switch (request.params.name) {
        case 'postTweet': {
            const { text } = args as TweetHandlerArgs;
            if (!text) throw new Error('Missing required parameter: text');
            return handlePostTweet(client, { text });
        }
        
        case 'postTweetWithMedia': {
            const { text, mediaPath, mediaType, altText } = args as MediaTweetHandlerArgs;
            if (!text) throw new Error('Missing required parameter: text');
            if (!mediaPath) throw new Error('Missing required parameter: mediaPath');
            if (!mediaType) throw new Error('Missing required parameter: mediaType');
            return handlePostTweetWithMedia(client, { text, mediaPath, mediaType, altText });
        }
        
        case 'getUserInfo': {
            const { username, fields } = args as GetUserInfoArgs;
            if (!username) throw new Error('Missing required parameter: username');
            return handleGetUserInfo(client, { username, fields });
        }
        
        case 'getUserTimeline':
            return handleGetUserTimeline(client, args as GetUserTimelineArgs);
        
        case 'followUser':
            return handleFollowUser(client, args as UserHandlerArgs);
        
        case 'unfollowUser':
            return handleUnfollowUser(client, args as UserHandlerArgs);
        
        case 'likeTweet':
            return handleLikeTweet(client, args as TweetEngagementArgs);
        
        case 'unlikeTweet':
            return handleUnlikeTweet(client, args as TweetEngagementArgs);
        
        case 'retweet':
            return handleRetweet(client, args as TweetEngagementArgs);
        
        case 'undoRetweet':
            return handleUndoRetweet(client, args as TweetEngagementArgs);
        
        case 'createList':
            return handleCreateList(client, args as ListCreateArgs);
        
        case 'addUserToList':
            return handleAddUserToList(client, args as ListMemberArgs);
        
        case 'removeUserFromList':
            return handleRemoveUserFromList(client, args as ListMemberArgs);
        
        case 'getListMembers':
            return handleGetListMembers(client, args as GetListMembersArgs);
        
        default:
            throw new Error(`Tool not found: ${request.params.name}`);
    }
});

const transport = new StdioServerTransport();
server.connect(transport).catch(console.error); 