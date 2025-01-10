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
    likeTweet: {
        description: 'Like a tweet by its ID',
        inputSchema: {
            type: 'object',
            properties: {
                tweetId: { type: 'string', description: 'The ID of the tweet to like' }
            },
            required: ['tweetId'],
        },
    },
    unlikeTweet: {
        description: 'Unlike a previously liked tweet',
        inputSchema: {
            type: 'object',
            properties: {
                tweetId: { type: 'string', description: 'The ID of the tweet to unlike' }
            },
            required: ['tweetId'],
        },
    },
    getLikedTweets: {
        description: 'Get a list of tweets liked by a user',
        inputSchema: {
            type: 'object',
            properties: {
                userId: { type: 'string', description: 'The ID of the user whose likes to fetch' },
                maxResults: { 
                    type: 'number', 
                    description: 'The maximum number of results to return (default: 100, max: 100)',
                    minimum: 1,
                    maximum: 100
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
            required: ['userId'],
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
        description: 'Get recent tweets from a user timeline with advanced filtering',
        inputSchema: {
            type: 'object',
            properties: {
                username: { type: 'string', description: 'The username of the user' },
                maxResults: { 
                    type: 'number', 
                    description: 'The maximum number of results to return (default: 100, max: 100)',
                    minimum: 1,
                    maximum: 100
                },
                paginationToken: { 
                    type: 'string', 
                    description: 'Token for fetching the next page of results'
                },
                excludeReplies: { 
                    type: 'boolean', 
                    description: 'Whether to exclude replies from the timeline'
                },
                excludeRetweets: { 
                    type: 'boolean', 
                    description: 'Whether to exclude retweets from the timeline'
                },
                startTime: { 
                    type: 'string', 
                    description: 'Start time for fetching tweets (ISO 8601 format)'
                },
                endTime: { 
                    type: 'string', 
                    description: 'End time for fetching tweets (ISO 8601 format)'
                },
                tweetFields: { 
                    type: 'array', 
                    items: { 
                        type: 'string',
                        enum: [
                            'created_at',
                            'author_id',
                            'conversation_id',
                            'in_reply_to_user_id',
                            'referenced_tweets',
                            'attachments',
                            'geo',
                            'context_annotations',
                            'entities',
                            'public_metrics',
                            'possibly_sensitive',
                            'source',
                            'withheld'
                        ]
                    },
                    description: 'Additional tweet fields to include in the response'
                },
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
    retweet: {
        description: 'Retweet a tweet by its ID',
        inputSchema: {
            type: 'object',
            properties: {
                tweetId: { type: 'string', description: 'The ID of the tweet to retweet' }
            },
            required: ['tweetId'],
        },
    },
    undoRetweet: {
        description: 'Undo a retweet by its ID',
        inputSchema: {
            type: 'object',
            properties: {
                tweetId: { type: 'string', description: 'The ID of the tweet to un-retweet' }
            },
            required: ['tweetId'],
        },
    },
    getRetweets: {
        description: 'Get a list of retweets of a tweet',
        inputSchema: {
            type: 'object',
            properties: {
                tweetId: { type: 'string', description: 'The ID of the tweet to get retweets for' },
                maxResults: { 
                    type: 'number', 
                    description: 'The maximum number of results to return (default: 100, max: 100)',
                    minimum: 1,
                    maximum: 100
                },
                userFields: { 
                    type: 'array', 
                    items: { 
                        type: 'string',
                        enum: ['description', 'profile_image_url', 'public_metrics', 'verified']
                    },
                    description: 'Additional user fields to include in the response'
                },
            },
            required: ['tweetId'],
        },
    },
    followUser: {
        description: 'Follow a user by their username',
        inputSchema: {
            type: 'object',
            properties: {
                username: { type: 'string', description: 'The username of the user to follow' }
            },
            required: ['username'],
        },
    },
    unfollowUser: {
        description: 'Unfollow a user by their username',
        inputSchema: {
            type: 'object',
            properties: {
                username: { type: 'string', description: 'The username of the user to unfollow' }
            },
            required: ['username'],
        },
    },
    getFollowers: {
        description: 'Get a list of followers for a user',
        inputSchema: {
            type: 'object',
            properties: {
                username: { type: 'string', description: 'The username of the user whose followers to fetch' },
                maxResults: { 
                    type: 'number', 
                    description: 'The maximum number of results to return (default: 100, max: 1000)',
                    minimum: 1,
                    maximum: 1000
                },
                userFields: { 
                    type: 'array', 
                    items: { 
                        type: 'string',
                        enum: ['description', 'profile_image_url', 'public_metrics', 'verified', 'location', 'url']
                    },
                    description: 'Additional user fields to include in the response'
                },
            },
            required: ['username'],
        },
    },
    getFollowing: {
        description: 'Get a list of users that a user is following',
        inputSchema: {
            type: 'object',
            properties: {
                username: { type: 'string', description: 'The username of the user whose following list to fetch' },
                maxResults: { 
                    type: 'number', 
                    description: 'The maximum number of results to return (default: 100, max: 1000)',
                    minimum: 1,
                    maximum: 1000
                },
                userFields: { 
                    type: 'array', 
                    items: { 
                        type: 'string',
                        enum: ['description', 'profile_image_url', 'public_metrics', 'verified', 'location', 'url']
                    },
                    description: 'Additional user fields to include in the response'
                },
            },
            required: ['username'],
        },
    },
    createList: {
        description: 'Create a new Twitter list',
        inputSchema: {
            type: 'object',
            properties: {
                name: { type: 'string', description: 'The name of the list' },
                description: { type: 'string', description: 'A description of the list' },
                private: { type: 'boolean', description: 'Whether the list should be private' }
            },
            required: ['name'],
        },
    },
    addUserToList: {
        description: 'Add a user to a Twitter list',
        inputSchema: {
            type: 'object',
            properties: {
                listId: { type: 'string', description: 'The ID of the list' },
                username: { type: 'string', description: 'The username of the user to add' }
            },
            required: ['listId', 'username'],
        },
    },
    removeUserFromList: {
        description: 'Remove a user from a Twitter list',
        inputSchema: {
            type: 'object',
            properties: {
                listId: { type: 'string', description: 'The ID of the list' },
                username: { type: 'string', description: 'The username of the user to remove' }
            },
            required: ['listId', 'username'],
        },
    },
    getListMembers: {
        description: 'Get members of a Twitter list',
        inputSchema: {
            type: 'object',
            properties: {
                listId: { type: 'string', description: 'The ID of the list' },
                maxResults: { 
                    type: 'number', 
                    description: 'The maximum number of results to return (default: 100, max: 100)',
                    minimum: 1,
                    maximum: 100
                },
                userFields: { 
                    type: 'array', 
                    items: { 
                        type: 'string',
                        enum: ['description', 'profile_image_url', 'public_metrics', 'verified', 'location', 'url']
                    },
                    description: 'Additional user fields to include in the response'
                },
            },
            required: ['listId'],
        },
    },
    getUserLists: {
        description: 'Get lists owned by a user',
        inputSchema: {
            type: 'object',
            properties: {
                username: { type: 'string', description: 'The username of the user whose lists to fetch' },
                maxResults: { 
                    type: 'number', 
                    description: 'The maximum number of results to return (default: 100, max: 100)',
                    minimum: 1,
                    maximum: 100
                },
                listFields: { 
                    type: 'array', 
                    items: { 
                        type: 'string',
                        enum: ['created_at', 'follower_count', 'member_count', 'private', 'description']
                    },
                    description: 'Additional list fields to include in the response'
                },
            },
            required: ['username'],
        },
    },
}; 