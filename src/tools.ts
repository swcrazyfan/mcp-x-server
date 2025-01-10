export const TOOLS = {
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
    replyToTweet: {
        description: 'Reply to a tweet on Twitter',
        inputSchema: {
            type: 'object',
            properties: {
                tweetId: { type: 'string', description: 'The ID of the tweet to reply to' },
                text: { type: 'string', description: 'The text of the reply' },
            },
            required: ['tweetId', 'text'],
        },
    },
    getUserTimeline: {
        description: 'Get recent tweets from a user timeline',
        inputSchema: {
            type: 'object',
            properties: {
                username: { type: 'string', description: 'The username of the user' },
            },
            required: ['username'],
        },
    },
}; 