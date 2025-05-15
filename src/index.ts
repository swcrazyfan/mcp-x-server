import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { ListToolsRequestSchema, CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { TwitterClient } from './client/twitter.js';
import { TOOLS } from './tools.js';
import { config } from 'dotenv';
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

// Load environment variables
config();

const server = new Server({
    name: 'x-mcp-server',
    version: '0.0.1',
}, {
    capabilities: {
        tools: TOOLS
    }
});

// Initialize Twitter client with all required credentials
const client = new TwitterClient({
    appKey: process.env.X_API_KEY || '',
    appSecret: process.env.X_API_SECRET || '',
    accessToken: process.env.X_ACCESS_TOKEN || '',
    accessSecret: process.env.X_ACCESS_TOKEN_SECRET || '',
});

server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: Object.entries(TOOLS).map(([name, tool]) => ({
        name,
        ...tool
    }))
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
    try {
        let response;

        switch (request.params.name) {
            case 'postTweet': {
                const { text } = request.params.arguments as { text: string };
                response = await handlePostTweet(client, { text });
                break;
            }
            case 'postTweetWithMedia': {
                const { text, mediaPath, mediaType, altText } = request.params.arguments as { 
                    text: string;
                    mediaPath: string;
                    mediaType: string;
                    altText?: string;
                };
                response = await handlePostTweetWithMedia(client, { text, mediaPath, mediaType, altText });
                break;
            }
            case 'getTweetById': {
                const { tweetId } = request.params.arguments as { tweetId: string };
                response = await handleGetTweetById(client, { tweetId });
                break;
            }
            case 'replyToTweet': {
                const { tweetId, text } = request.params.arguments as { tweetId: string; text: string };
                response = await handleReplyToTweet(client, { tweetId, text });
                break;
            }
            case 'deleteTweet': {
                const { tweetId } = request.params.arguments as { tweetId: string };
                response = await handleDeleteTweet(client, { tweetId });
                break;
            }
            case 'likeTweet': {
                const { tweetId } = request.params.arguments as { tweetId: string };
                response = await handleLikeTweet(client, { tweetId });
                break;
            }
            case 'unlikeTweet': {
                const { tweetId } = request.params.arguments as { tweetId: string };
                response = await handleUnlikeTweet(client, { tweetId });
                break;
            }
            case 'retweet': {
                const { tweetId } = request.params.arguments as { tweetId: string };
                response = await handleRetweet(client, { tweetId });
                break;
            }
            case 'undoRetweet': {
                const { tweetId } = request.params.arguments as { tweetId: string };
                response = await handleUndoRetweet(client, { tweetId });
                break;
            }
            case 'getRetweets': {
                const { tweetId, maxResults } = request.params.arguments as { tweetId: string; maxResults?: number };
                response = await handleGetRetweets(client, { tweetId, maxResults });
                break;
            }
            case 'getLikedTweets': {
                const { userId, maxResults } = request.params.arguments as { userId: string; maxResults?: number };
                response = await handleGetLikedTweets(client, { userId, maxResults });
                break;
            }
            case 'getUserInfo': {
                const { username } = request.params.arguments as { username: string };
                response = await handleGetUserInfo(client, { username });
                break;
            }
            case 'getUserTimeline': {
                const args = request.params.arguments as unknown as GetUserTimelineArgs;
                response = await handleGetUserTimeline(client, args);
                break;
            }
            case 'followUser': {
                const { username } = request.params.arguments as { username: string };
                response = await handleFollowUser(client, { username });
                break;
            }
            case 'unfollowUser': {
                const { username } = request.params.arguments as { username: string };
                response = await handleUnfollowUser(client, { username });
                break;
            }
            case 'getFollowers': {
                const { username, maxResults } = request.params.arguments as { username: string; maxResults?: number };
                response = await handleGetFollowers(client, { username, maxResults });
                break;
            }
            case 'getFollowing': {
                const { username, maxResults } = request.params.arguments as { username: string; maxResults?: number };
                response = await handleGetFollowing(client, { username, maxResults });
                break;
            }
            case 'createList': {
                const { name, description, isPrivate } = request.params.arguments as { 
                    name: string;
                    description?: string;
                    isPrivate?: boolean;
                };
                response = await handleCreateList(client, { name, description, isPrivate });
                break;
            }
            case 'addUserToList': {
                const { listId, userId } = request.params.arguments as { listId: string; userId: string };
                response = await handleAddUserToList(client, { listId, userId });
                break;
            }
            case 'removeUserFromList': {
                const { listId, userId } = request.params.arguments as { listId: string; userId: string };
                response = await handleRemoveUserFromList(client, { listId, userId });
                break;
            }
            case 'getListMembers': {
                const { listId, maxResults, userFields } = request.params.arguments as {
                    listId: string;
                    maxResults?: number;
                    userFields?: string[];
                };
                response = await handleGetListMembers(client, { listId, maxResults, userFields });
                break;
            }
            case 'getUserLists': {
                const { username, maxResults } = request.params.arguments as { username: string; maxResults?: number };
                response = await handleGetUserLists(client, { username, maxResults });
                break;
            }
            case 'searchTweets': {
                const { query, maxResults } = request.params.arguments as { query: string; maxResults?: number };
                response = await handleSearchTweets(client, { query, maxResults });
                break;
            }
            case 'getHashtagAnalytics': {
                const { hashtag, startTime, endTime } = request.params.arguments as {
                    hashtag: string;
                    startTime?: string;
                    endTime?: string;
                };
                response = await handleHashtagAnalytics(client, { hashtag, startTime, endTime });
                break;
            }
            default:
                throw new Error(`Unknown tool: ${request.params.name}`);
        }

                return {
            content: [{ type: 'text', text: response.response }],
            tools: response.tools
            };
        } catch (error) {
            if (error instanceof Error) {
            return {
                content: [{ type: 'text', text: `Error: ${error.message}` }]
            };
        }
        return {
            content: [{ type: 'text', text: 'An unknown error occurred' }]
        };
    }
});

const transport = new StdioServerTransport();
server.connect(transport).catch(console.error); 