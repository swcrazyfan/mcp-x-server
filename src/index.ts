import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { ListToolsRequestSchema, CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { getTwitterClient } from './twitterClient.js';
import { TweetV2, ReferencedTweetV2 } from 'twitter-api-v2';
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
    assertGetFollowingArgs,
    assertCreateListArgs,
    assertAddUserToListArgs,
    assertRemoveUserFromListArgs,
    assertGetListMembersArgs,
    assertGetUserListsArgs,
    assertSendDirectMessageArgs,
    assertGetDirectMessagesArgs,
    assertGetDirectMessageByIdArgs,
    assertDeleteDirectMessageArgs,
    assertGetTweetAnalyticsArgs,
    assertGetUserAnalyticsArgs,
    assertGetHashtagAnalyticsArgs
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
        try {
            const { 
                username, 
                maxResults, 
                paginationToken, 
                excludeReplies, 
                excludeRetweets,
                startTime,
                endTime,
                tweetFields 
            } = request.params.arguments;

            const userResponse = await client.v2.userByUsername(username);
            if (!userResponse.data) {
                throw new Error(`User not found: ${username}`);
            }

            const options: any = {
                max_results: maxResults || 100
            };

            if (paginationToken) {
                options.pagination_token = paginationToken;
            }

            if (startTime) {
                options.start_time = startTime;
            }

            if (endTime) {
                options.end_time = endTime;
            }

            if (tweetFields && tweetFields.length > 0) {
                options['tweet.fields'] = tweetFields.join(',');
            }

            // Get tweets with all specified options
            const timeline = await client.v2.userTimeline(userResponse.data.id, options);
            
            // Process tweets data
            const tweets = timeline.tweets || [];
            const processedTweets = excludeReplies || excludeRetweets
                ? tweets.filter((tweet: TweetV2) => {
                    if (excludeReplies && tweet.in_reply_to_user_id) {
                        return false;
                    }
                    if (excludeRetweets && tweet.referenced_tweets?.some((ref: ReferencedTweetV2) => ref.type === 'retweeted')) {
                        return false;
                    }
                    return true;
                })
                : tweets;

            const response = {
                tweets: processedTweets,
                ...(timeline.meta?.next_token && { next_token: timeline.meta.next_token })
            };

            return {
                content: [{ 
                    type: 'text', 
                    text: JSON.stringify(response, null, 2)
                }],
            };
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to get user timeline: ${error.message}`);
            }
            throw error;
        }
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

    if (request.params.name === 'createList') {
        assertCreateListArgs(request.params.arguments);
        try {
            const { name, description, private: isPrivate } = request.params.arguments;
            const list = await client.v2.createList({
                name,
                description,
                private: isPrivate
            });
            return {
                content: [{ type: 'text', text: `List created with id: ${list.data.id}` }],
            };
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to create list: ${error.message}`);
            }
            throw error;
        }
    }

    if (request.params.name === 'addUserToList') {
        assertAddUserToListArgs(request.params.arguments);
        try {
            const { listId, username } = request.params.arguments;
            const targetUser = await client.v2.userByUsername(username);
            if (!targetUser.data) {
                throw new Error(`User not found: ${username}`);
            }
            await client.v2.addListMember(listId, targetUser.data.id);
            return {
                content: [{ type: 'text', text: `Successfully added user ${username} to list ${listId}` }],
            };
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to add user to list: ${error.message}`);
            }
            throw error;
        }
    }

    if (request.params.name === 'removeUserFromList') {
        assertRemoveUserFromListArgs(request.params.arguments);
        try {
            const { listId, username } = request.params.arguments;
            const targetUser = await client.v2.userByUsername(username);
            if (!targetUser.data) {
                throw new Error(`User not found: ${username}`);
            }
            await client.v2.removeListMember(listId, targetUser.data.id);
            return {
                content: [{ type: 'text', text: `Successfully removed user ${username} from list ${listId}` }],
            };
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to remove user from list: ${error.message}`);
            }
            throw error;
        }
    }

    if (request.params.name === 'getListMembers') {
        assertGetListMembersArgs(request.params.arguments);
        try {
            const { listId, maxResults, userFields } = request.params.arguments;
            
            const options: any = {
                max_results: maxResults || 100
            };
            
            if (userFields && userFields.length > 0) {
                options['user.fields'] = userFields.join(',');
            }

            const members = await client.v2.listMembers(listId, options);
            if (!members.data) {
                return {
                    content: [{ type: 'text', text: 'No members found in list' }],
                };
            }

            return {
                content: [{ 
                    type: 'text', 
                    text: `List members: ${JSON.stringify(members.data, null, 2)}` 
                }],
            };
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to get list members: ${error.message}`);
            }
            throw error;
        }
    }

    if (request.params.name === 'getUserLists') {
        assertGetUserListsArgs(request.params.arguments);
        try {
            const { username, maxResults, listFields } = request.params.arguments;
            
            const targetUser = await client.v2.userByUsername(username);
            if (!targetUser.data) {
                throw new Error(`User not found: ${username}`);
            }

            const options: any = {
                max_results: maxResults || 100
            };
            
            if (listFields && listFields.length > 0) {
                options['list.fields'] = listFields.join(',');
            }

            const lists = await client.v2.listsOwned(targetUser.data.id, options);
            if (!lists.data) {
                return {
                    content: [{ type: 'text', text: 'No lists found' }],
                };
            }

            return {
                content: [{ 
                    type: 'text', 
                    text: `User's lists: ${JSON.stringify(lists.data, null, 2)}` 
                }],
            };
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to get user's lists: ${error.message}`);
            }
            throw error;
        }
    }

    if (request.params.name === 'sendDirectMessage') {
        assertSendDirectMessageArgs(request.params.arguments);
        try {
            const { recipientUsername, text, mediaPath, mediaType } = request.params.arguments;

            // Get recipient's user ID
            const recipientUser = await client.v2.userByUsername(recipientUsername);
            if (!recipientUser.data) {
                throw new Error(`User not found: ${recipientUsername}`);
            }

            let mediaId: string | undefined;
            if (mediaPath && mediaType) {
                // Upload media if provided
                const mediaBuffer = await fs.readFile(mediaPath);
                mediaId = await client.v1.uploadMedia(mediaBuffer, { mimeType: mediaType });
            }

            // Create a DM conversation
            const conversation = await client.v2.createDmConversation({
                participant_ids: [recipientUser.data.id],
                conversation_type: 'Group',
                message: {
                    text,
                    ...(mediaId && { media: { media_id: mediaId } })
                }
            });

            return {
                content: [{ 
                    type: 'text', 
                    text: 'Direct message sent successfully'
                }],
            };
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to send direct message: ${error.message}`);
            }
            throw error;
        }
    }

    if (request.params.name === 'getDirectMessages') {
        assertGetDirectMessagesArgs(request.params.arguments);
        try {
            const { maxResults, paginationToken } = request.params.arguments;

            // Get the authenticated user's ID
            const me = await client.v2.me();
            
            // Note: Due to API limitations, we can only get DM conversations
            // Individual messages must be fetched separately
            const conversations = await client.v2.createDmConversation({
                participant_ids: [me.data.id],
                conversation_type: 'Group',
                message: { text: '' }
            });

            return {
                content: [{ 
                    type: 'text', 
                    text: 'Note: Due to Twitter API limitations, direct message listing is currently limited. Please use getDirectMessageById to fetch specific messages.'
                }],
            };
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to get direct messages: ${error.message}`);
            }
            throw error;
        }
    }

    if (request.params.name === 'getDirectMessageById') {
        assertGetDirectMessageByIdArgs(request.params.arguments);
        try {
            // Note: Due to API limitations, we can only get the conversation
            // that contains the message, not the specific message
            const conversation = await client.v2.createDmConversation({
                participant_ids: [request.params.arguments.messageId],
                conversation_type: 'Group',
                message: { text: '' }
            });

            return {
                content: [{ 
                    type: 'text', 
                    text: 'Note: Due to Twitter API limitations, fetching specific direct messages is currently limited.'
                }],
            };
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to get direct message: ${error.message}`);
            }
            throw error;
        }
    }

    if (request.params.name === 'deleteDirectMessage') {
        assertDeleteDirectMessageArgs(request.params.arguments);
        try {
            // Note: Due to API limitations, message deletion is not directly supported
            return {
                content: [{ 
                    type: 'text', 
                    text: 'Note: Due to Twitter API limitations, direct message deletion is currently not supported.'
                }],
            };
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to delete direct message: ${error.message}`);
            }
            throw error;
        }
    }

    if (request.params.name === 'getTweetAnalytics') {
        assertGetTweetAnalyticsArgs(request.params.arguments);
        try {
            const { 
                tweetId, 
                includeNonPublicMetrics, 
                includeOrganicMetrics, 
                includePromotedMetrics 
            } = request.params.arguments;

            const options: any = {
                'tweet.fields': [
                    'public_metrics',
                    'created_at',
                    'author_id',
                    ...(includeNonPublicMetrics ? ['non_public_metrics'] : []),
                    ...(includeOrganicMetrics ? ['organic_metrics'] : []),
                    ...(includePromotedMetrics ? ['promoted_metrics'] : [])
                ].join(',')
            };

            const tweet = await client.v2.singleTweet(tweetId, options);
            if (!tweet.data) {
                throw new Error(`Tweet not found: ${tweetId}`);
            }

            // Get engagement details
            const [retweetedBy, likedBy] = await Promise.all([
                client.v2.tweetRetweetedBy(tweetId),
                client.v2.tweetLikedBy(tweetId)
            ]);

            const analytics = {
                tweet: tweet.data,
                engagement: {
                    retweetedBy: retweetedBy.data || [],
                    likedBy: likedBy.data || []
                }
            };

            return {
                content: [{ 
                    type: 'text', 
                    text: JSON.stringify(analytics, null, 2)
                }],
            };
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to get tweet analytics: ${error.message}`);
            }
            throw error;
        }
    }

    if (request.params.name === 'getUserAnalytics') {
        assertGetUserAnalyticsArgs(request.params.arguments);
        try {
            const { username, startTime, endTime, granularity } = request.params.arguments;

            // Get user details
            const user = await client.v2.userByUsername(username, {
                'user.fields': ['public_metrics', 'created_at', 'description', 'profile_image_url']
            });
            if (!user.data) {
                throw new Error(`User not found: ${username}`);
            }

            // Get recent tweets for engagement analysis
            const timeline = await client.v2.userTimeline(user.data.id, {
                max_results: 100,
                'tweet.fields': ['public_metrics', 'created_at'],
                start_time: startTime,
                end_time: endTime
            });

            // Calculate engagement metrics
            const tweets = timeline.tweets || [];
            const tweetMetrics = tweets.map((tweet: TweetV2) => ({
                id: tweet.id,
                created_at: tweet.created_at,
                metrics: tweet.public_metrics
            }));

            const analytics = {
                user: user.data,
                tweets: {
                    count: tweetMetrics.length,
                    metrics: tweetMetrics
                },
                aggregated: {
                    total_likes: tweetMetrics.reduce((sum: number, tweet: { metrics?: { like_count?: number } }) => 
                        sum + (tweet.metrics?.like_count || 0), 0),
                    total_retweets: tweetMetrics.reduce((sum: number, tweet: { metrics?: { retweet_count?: number } }) => 
                        sum + (tweet.metrics?.retweet_count || 0), 0),
                    total_replies: tweetMetrics.reduce((sum: number, tweet: { metrics?: { reply_count?: number } }) => 
                        sum + (tweet.metrics?.reply_count || 0), 0),
                    total_quotes: tweetMetrics.reduce((sum: number, tweet: { metrics?: { quote_count?: number } }) => 
                        sum + (tweet.metrics?.quote_count || 0), 0)
                }
            };

            return {
                content: [{ 
                    type: 'text', 
                    text: JSON.stringify(analytics, null, 2)
                }],
            };
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to get user analytics: ${error.message}`);
            }
            throw error;
        }
    }

    if (request.params.name === 'getHashtagAnalytics') {
        assertGetHashtagAnalyticsArgs(request.params.arguments);
        try {
            const { hashtag, startTime, endTime, maxResults } = request.params.arguments;

            const query = `#${hashtag}`;
            const options: any = {
                max_results: maxResults || 100,
                'tweet.fields': ['public_metrics', 'created_at', 'author_id'],
                'user.fields': ['username', 'public_metrics']
            };

            if (startTime) options.start_time = startTime;
            if (endTime) options.end_time = endTime;

            // Search for tweets with the hashtag
            const searchResult = await client.v2.search(query, options);
            const tweets = Array.isArray(searchResult.data) ? searchResult.data : [];

            // Analyze hashtag usage
            const tweetAnalytics = tweets.map((tweet: TweetV2) => ({
                id: tweet.id,
                created_at: tweet.created_at,
                metrics: tweet.public_metrics,
                author_id: tweet.author_id
            }));

            const analytics = {
                hashtag: hashtag,
                tweet_count: tweetAnalytics.length,
                tweets: tweetAnalytics,
                aggregated: {
                    total_likes: tweetAnalytics.reduce((sum: number, tweet: { metrics?: { like_count?: number } }) => 
                        sum + (tweet.metrics?.like_count || 0), 0),
                    total_retweets: tweetAnalytics.reduce((sum: number, tweet: { metrics?: { retweet_count?: number } }) => 
                        sum + (tweet.metrics?.retweet_count || 0), 0),
                    total_replies: tweetAnalytics.reduce((sum: number, tweet: { metrics?: { reply_count?: number } }) => 
                        sum + (tweet.metrics?.reply_count || 0), 0),
                    total_quotes: tweetAnalytics.reduce((sum: number, tweet: { metrics?: { quote_count?: number } }) => 
                        sum + (tweet.metrics?.quote_count || 0), 0)
                }
            };

            return {
                content: [{ 
                    type: 'text', 
                    text: JSON.stringify(analytics, null, 2)
                }],
            };
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to get hashtag analytics: ${error.message}`);
            }
            throw error;
        }
    }

    throw new Error(`Tool not found: ${request.params.name}`);
});

const transport = new StdioServerTransport();
server.connect(transport).catch(console.error); 