import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { ListToolsRequestSchema, CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { getTwitterClient } from './twitterClient.js';
import { 
    assertPostTweetArgs, 
    assertSearchTweetsArgs, 
    assertReplyToTweetArgs, 
    assertGetUserTimelineArgs, 
    assertGetTweetByIdArgs, 
    assertGetUserInfoArgs, 
    assertGetTweetsByIdsArgs, 
    assertPostTweetWithMediaArgs,
    assertLikeTweetArgs,
    assertUnlikeTweetArgs,
    assertGetLikedTweetsArgs,
    assertRetweetArgs,
    assertUndoRetweetArgs,
    assertGetRetweetsArgs,
    assertFollowUserArgs,
    assertUnfollowUserArgs,
    assertGetFollowersArgs,
    assertGetFollowingArgs
} from './types.js';
import { TOOLS } from './tools.js';
import { promises as fs } from 'fs';

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
        const tweet = await client.v2.tweet({ text: request.params.arguments.text });
        return {
            content: [{ type: 'text', text: `Tweet posted with id: ${tweet.data.id}` }],
        };
    }

    if (request.params.name === 'postTweetWithMedia') {
        assertPostTweetWithMediaArgs(request.params.arguments);
        const { text, mediaPath, mediaType, altText } = request.params.arguments;

        try {
            // Read the media file
            const mediaBuffer = await fs.readFile(mediaPath);

            // Upload the media
            const mediaId = await client.v1.uploadMedia(mediaBuffer, { mimeType: mediaType });

            // Set alt text if provided
            if (altText) {
                await client.v1.createMediaMetadata(mediaId, { alt_text: { text: altText } });
            }

            // Post the tweet with media
            const tweet = await client.v2.tweet({
                text,
                media: { media_ids: [mediaId] }
            });

            return {
                content: [{ type: 'text', text: `Tweet posted with media, id: ${tweet.data.id}` }],
            };
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to post tweet with media: ${error.message}`);
            }
            throw error;
        }
    }

    if (request.params.name === 'searchTweets') {
        assertSearchTweetsArgs(request.params.arguments);
        const { query, since, until, tweetFields } = request.params.arguments;
        
        const searchOptions: any = {};
        if (since) searchOptions.start_time = since;
        if (until) searchOptions.end_time = until;
        if (tweetFields && tweetFields.length > 0) {
            searchOptions['tweet.fields'] = tweetFields.join(',');
        }

        const tweets = await client.v2.search(query, searchOptions);
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

    if (request.params.name === 'getTweetById') {
        assertGetTweetByIdArgs(request.params.arguments);
        const tweet = await client.v2.singleTweet(request.params.arguments.tweetId);
        if (!tweet.data) {
            throw new Error(`Tweet not found: ${request.params.arguments.tweetId}`);
        }
        return {
            content: [{ 
                type: 'text', 
                text: `Tweet: ${JSON.stringify(tweet.data, null, 2)}` 
            }],
        };
    }

    if (request.params.name === 'getUserInfo') {
        assertGetUserInfoArgs(request.params.arguments);
        const user = await client.v2.userByUsername(
            request.params.arguments.username,
            { 
                'user.fields': ['description', 'public_metrics', 'profile_image_url', 'verified']
            }
        );
        if (!user.data) {
            throw new Error(`User not found: ${request.params.arguments.username}`);
        }
        return {
            content: [{ 
                type: 'text', 
                text: `User info: ${JSON.stringify(user.data, null, 2)}` 
            }],
        };
    }

    if (request.params.name === 'getTweetsByIds') {
        assertGetTweetsByIdsArgs(request.params.arguments);
        const { tweetIds, tweetFields } = request.params.arguments;
        
        const options: any = {};
        if (tweetFields && tweetFields.length > 0) {
            options['tweet.fields'] = tweetFields.join(',');
        }

        const tweets = await client.v2.tweets(tweetIds, options);
        if (!tweets.data || tweets.data.length === 0) {
            throw new Error('No tweets found for the provided IDs');
        }
        return {
            content: [{ 
                type: 'text', 
                text: `Tweets: ${JSON.stringify(tweets.data, null, 2)}` 
            }],
        };
    }

    if (request.params.name === 'likeTweet') {
        assertLikeTweetArgs(request.params.arguments);
        try {
            const userId = await client.v2.me().then(response => response.data.id);
            await client.v2.like(userId, request.params.arguments.tweetId);
            return {
                content: [{ type: 'text', text: `Successfully liked tweet: ${request.params.arguments.tweetId}` }],
            };
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to like tweet: ${error.message}`);
            }
            throw error;
        }
    }

    if (request.params.name === 'unlikeTweet') {
        assertUnlikeTweetArgs(request.params.arguments);
        try {
            const userId = await client.v2.me().then(response => response.data.id);
            await client.v2.unlike(userId, request.params.arguments.tweetId);
            return {
                content: [{ type: 'text', text: `Successfully unliked tweet: ${request.params.arguments.tweetId}` }],
            };
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to unlike tweet: ${error.message}`);
            }
            throw error;
        }
    }

    if (request.params.name === 'getLikedTweets') {
        assertGetLikedTweetsArgs(request.params.arguments);
        try {
            const { userId, maxResults, tweetFields } = request.params.arguments;
            
            const options: any = {
                max_results: maxResults || 100
            };
            
            if (tweetFields && tweetFields.length > 0) {
                options['tweet.fields'] = tweetFields.join(',');
            }

            const likedTweets = await client.v2.userLikedTweets(userId, options);
            if (!likedTweets.data) {
                return {
                    content: [{ type: 'text', text: 'No liked tweets found' }],
                };
            }

            return {
                content: [{ 
                    type: 'text', 
                    text: `Liked tweets: ${JSON.stringify(likedTweets.data, null, 2)}` 
                }],
            };
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to get liked tweets: ${error.message}`);
            }
            throw error;
        }
    }

    if (request.params.name === 'retweet') {
        assertRetweetArgs(request.params.arguments);
        try {
            const userId = await client.v2.me().then(response => response.data.id);
            await client.v2.retweet(userId, request.params.arguments.tweetId);
            return {
                content: [{ type: 'text', text: `Successfully retweeted tweet: ${request.params.arguments.tweetId}` }],
            };
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to retweet: ${error.message}`);
            }
            throw error;
        }
    }

    if (request.params.name === 'undoRetweet') {
        assertUndoRetweetArgs(request.params.arguments);
        try {
            const userId = await client.v2.me().then(response => response.data.id);
            await client.v2.unretweet(userId, request.params.arguments.tweetId);
            return {
                content: [{ type: 'text', text: `Successfully undid retweet: ${request.params.arguments.tweetId}` }],
            };
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to undo retweet: ${error.message}`);
            }
            throw error;
        }
    }

    if (request.params.name === 'getRetweets') {
        assertGetRetweetsArgs(request.params.arguments);
        try {
            const { tweetId, maxResults, userFields } = request.params.arguments;
            
            const options: any = {
                max_results: maxResults || 100
            };
            
            if (userFields && userFields.length > 0) {
                options['user.fields'] = userFields.join(',');
            }

            const retweets = await client.v2.tweetRetweetedBy(tweetId, options);
            if (!retweets.data) {
                return {
                    content: [{ type: 'text', text: 'No retweets found' }],
                };
            }

            return {
                content: [{ 
                    type: 'text', 
                    text: `Users who retweeted: ${JSON.stringify(retweets.data, null, 2)}` 
                }],
            };
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to get retweets: ${error.message}`);
            }
            throw error;
        }
    }

    if (request.params.name === 'followUser') {
        assertFollowUserArgs(request.params.arguments);
        try {
            const userId = await client.v2.me().then(response => response.data.id);
            const targetUser = await client.v2.userByUsername(request.params.arguments.username);
            if (!targetUser.data) {
                throw new Error(`User not found: ${request.params.arguments.username}`);
            }
            await client.v2.follow(userId, targetUser.data.id);
            return {
                content: [{ type: 'text', text: `Successfully followed user: ${request.params.arguments.username}` }],
            };
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to follow user: ${error.message}`);
            }
            throw error;
        }
    }

    if (request.params.name === 'unfollowUser') {
        assertUnfollowUserArgs(request.params.arguments);
        try {
            const userId = await client.v2.me().then(response => response.data.id);
            const targetUser = await client.v2.userByUsername(request.params.arguments.username);
            if (!targetUser.data) {
                throw new Error(`User not found: ${request.params.arguments.username}`);
            }
            await client.v2.unfollow(userId, targetUser.data.id);
            return {
                content: [{ type: 'text', text: `Successfully unfollowed user: ${request.params.arguments.username}` }],
            };
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to unfollow user: ${error.message}`);
            }
            throw error;
        }
    }

    if (request.params.name === 'getFollowers') {
        assertGetFollowersArgs(request.params.arguments);
        try {
            const { username, maxResults, userFields } = request.params.arguments;
            
            const targetUser = await client.v2.userByUsername(username);
            if (!targetUser.data) {
                throw new Error(`User not found: ${username}`);
            }

            const options: any = {
                max_results: maxResults || 100
            };
            
            if (userFields && userFields.length > 0) {
                options['user.fields'] = userFields.join(',');
            }

            const followers = await client.v2.followers(targetUser.data.id, options);
            if (!followers.data) {
                return {
                    content: [{ type: 'text', text: 'No followers found' }],
                };
            }

            return {
                content: [{ 
                    type: 'text', 
                    text: `Followers: ${JSON.stringify(followers.data, null, 2)}` 
                }],
            };
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to get followers: ${error.message}`);
            }
            throw error;
        }
    }

    if (request.params.name === 'getFollowing') {
        assertGetFollowingArgs(request.params.arguments);
        try {
            const { username, maxResults, userFields } = request.params.arguments;
            
            const targetUser = await client.v2.userByUsername(username);
            if (!targetUser.data) {
                throw new Error(`User not found: ${username}`);
            }

            const options: any = {
                max_results: maxResults || 100
            };
            
            if (userFields && userFields.length > 0) {
                options['user.fields'] = userFields.join(',');
            }

            const following = await client.v2.following(targetUser.data.id, options);
            if (!following.data) {
                return {
                    content: [{ type: 'text', text: 'No following users found' }],
                };
            }

            return {
                content: [{ 
                    type: 'text', 
                    text: `Following: ${JSON.stringify(following.data, null, 2)}` 
                }],
            };
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to get following users: ${error.message}`);
            }
            throw error;
        }
    }

    throw new Error(`Tool not found: ${request.params.name}`);
});

const transport = new StdioServerTransport();
server.connect(transport).catch(console.error); 