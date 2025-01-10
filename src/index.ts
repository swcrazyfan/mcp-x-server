import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { ListToolsRequestSchema, CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { getTwitterClient } from './twitterClient.js';
import { assertPostTweetArgs, assertSearchTweetsArgs, assertReplyToTweetArgs, assertGetUserTimelineArgs } from './types.js';
import { TOOLS } from './tools.js';

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

    if (request.params.name === 'replyToTweet') {
        assertReplyToTweetArgs(request.params.arguments);
        const reply = await client.v2.tweet({
            text: request.params.arguments.text,
            reply: {
                in_reply_to_tweet_id: request.params.arguments.tweetId,
            },
        });
        return {
            content: [{ type: 'text', text: `Replied to tweet ${request.params.arguments.tweetId} with id: ${reply.data.id}` }],
        };
    }

    if (request.params.name === 'getUserTimeline') {
        assertGetUserTimelineArgs(request.params.arguments);
        const userResponse = await client.v2.userByUsername(request.params.arguments.username);
        if (!userResponse.data) {
            throw new Error(`User not found: ${request.params.arguments.username}`);
        }
        const tweets = await client.v2.userTimeline(userResponse.data.id);
        return {
            content: [{ 
                type: 'text', 
                text: `User timeline: ${JSON.stringify(tweets.data, null, 2)}` 
            }],
        };
    }

    throw new Error(`Tool not found: ${request.params.name}`);
});

const transport = new StdioServerTransport();
server.connect(transport).catch(console.error); 