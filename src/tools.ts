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
    postTweetWithMedia: {
        description: 'Post a tweet with media attachment to Twitter',
        inputSchema: {
            type: 'object',
            properties: {
                text: { type: 'string', description: 'The text of the tweet' },
                mediaPath: { type: 'string', description: 'Local file path to the media to upload' },
                mediaType: { 
                    type: 'string', 
                    enum: ['image/jpeg', 'image/png', 'image/gif', 'video/mp4'],
                    description: 'MIME type of the media file'
                },
                altText: { 
                    type: 'string', 
                    description: 'Alternative text for the media (accessibility)'
                }
            },
            required: ['text', 'mediaPath', 'mediaType'],
        },
    },
    searchTweets: {
        description: 'Search for tweets on Twitter with advanced options',
        inputSchema: {
            type: 'object',
            properties: {
                query: { type: 'string', description: 'The query to search for' },
                since: { type: 'string', description: 'Start time for search (ISO 8601 format)' },
                until: { type: 'string', description: 'End time for search (ISO 8601 format)' },
                tweetFields: { 
                    type: 'array', 
                    items: { 
                        type: 'string',
                        enum: ['created_at', 'author_id', 'conversation_id', 'public_metrics', 'entities', 'context_annotations']
                    },
                    description: 'Additional tweet fields to include in the response'
                },
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
    getTweetById: {
        description: 'Get a tweet by its ID',
        inputSchema: {
            type: 'object',
            properties: {
                tweetId: { type: 'string', description: 'The ID of the tweet' },
            },
            required: ['tweetId'],
        },
    },
    getUserInfo: {
        description: 'Get information about a Twitter user',
        inputSchema: {
            type: 'object',
            properties: {
                username: { type: 'string', description: 'The username of the user' },
            },
            required: ['username'],
        },
    },
    getTweetsByIds: {
        description: 'Get multiple tweets by their IDs',
        inputSchema: {
            type: 'object',
            properties: {
                tweetIds: { 
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Array of tweet IDs to fetch',
                    maxItems: 100
                },
                tweetFields: { 
                    type: 'array', 
                    items: { 
                        type: 'string',
                        enum: ['created_at', 'author_id', 'conversation_id', 'public_metrics', 'entities', 'context_annotations']
                    },
                    description: 'Additional tweet fields to include in the response'
                },
            },
            required: ['tweetIds'],
        },
    },
}; 