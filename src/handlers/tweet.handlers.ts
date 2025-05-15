import { TwitterClient as ApiV2Client } from '../client/twitter.js';
import { TwikitBridgeClient } from '../client/twikitBridgeClient.js';
import { HandlerResponse, GetUserTimelineArgs as AppGetUserTimelineArgs } from '../types/handlers.js';
import { createResponse } from '../utils/response.js';
import { TweetV2, TTweetv2Expansion, TTweetv2UserField } from 'twitter-api-v2';

export interface MediaTweetHandlerArgs {
    text: string;
    mediaPath: string;
    mediaType: string;
    altText?: string;
}

// Type guard to check client type
function isApiV2Client(client: ApiV2Client | TwikitBridgeClient): client is ApiV2Client {
    return client instanceof ApiV2Client;
}

export async function handlePostTweet(
    client: ApiV2Client | TwikitBridgeClient,
    { text }: { text: string }
): Promise<HandlerResponse> {
    try {
        if (isApiV2Client(client)) {
            const tweet = await client.v2.tweet(text);
            return createResponse(`Successfully posted tweet: ${tweet.data.id}`);
        } else {
            // Assuming TwikitBridgeClient has a createTweet method
            const result = await client.createTweet(text);
            // Assuming result has an id or similar identifier. This will need adjustment based on actual twikit output.
            return createResponse(`Successfully posted tweet (via Twikit): ${result.id || JSON.stringify(result)}`);
        }
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`Failed to post tweet: ${error.message}`);
        }
        throw new Error('Failed to post tweet: Unknown error occurred');
    }
}

export async function handlePostTweetWithMedia(
    client: ApiV2Client | TwikitBridgeClient,
    { text, mediaPath, mediaType, altText }: MediaTweetHandlerArgs
): Promise<HandlerResponse> {
    try {
        if (isApiV2Client(client)) {
            const mediaId = await client.v1.uploadMedia(mediaPath, { type: mediaType });
            if (altText) {
                await client.v1.createMediaMetadata(mediaId, { alt_text: { text: altText } });
            }
            const tweet = await client.v2.tweet(text, { media: { media_ids: [mediaId] } });
            return createResponse(`Successfully posted tweet with media: ${tweet.data.id}`);
        } else {
            // Twikit media upload is more complex: client.upload_media then pass media_id to create_tweet
            const mediaId = await client.uploadMedia(mediaPath, mediaType);
            const result = await client.createTweet(text, [mediaId]); 
            return createResponse(`Successfully posted tweet with media (via Twikit): ${result.id || JSON.stringify(result)}`);
        }
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`Failed to post tweet with media: ${error.message}`);
        }
        throw new Error('Failed to post tweet with media: Unknown error occurred');
    }
}

export async function handleGetTweetById(
    client: ApiV2Client | TwikitBridgeClient,
    { tweetId }: { tweetId: string }
): Promise<HandlerResponse> {
    try {
        if (isApiV2Client(client)) {
            const tweet = await client.v2.singleTweet(tweetId, {
                'tweet.fields': 'created_at,public_metrics,text,author_id',
                'expansions': 'author_id',
                'user.fields': 'username,name'
            });
            return createResponse(`Tweet details: ${JSON.stringify(tweet, null, 2)}`);
        } else {
            // Assuming TwikitBridgeClient has a getTweetById method
            const result = await (client as TwikitBridgeClient).sendCommand('get_tweet_by_id', { id: tweetId });
            // Data transformation will be key here. Twikit's Tweet object is different.
            return createResponse(`Tweet details (via Twikit): ${JSON.stringify(result, null, 2)}`);
        }
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`Failed to get tweet: ${error.message}`);
        }
        throw new Error('Failed to get tweet: Unknown error occurred');
    }
}

export async function handleReplyToTweet(
    client: ApiV2Client | TwikitBridgeClient,
    { tweetId, text }: { tweetId: string; text: string }
): Promise<HandlerResponse> {
    try {
        if (isApiV2Client(client)) {
            const tweet = await client.v2.reply(text, tweetId);
            return createResponse(`Successfully replied to tweet: ${tweet.data.id}`);
        } else {
            // Twikit: tweet_object.reply(text) or client.create_tweet(text, reply_to=tweet_id)
            // Let's assume client.create_tweet with a reply_to parameter for now.
            const result = await (client as TwikitBridgeClient).sendCommand('create_tweet', {text: text, reply_to: tweetId});
            return createResponse(`Successfully replied to tweet (via Twikit): ${result.id || JSON.stringify(result)}`);
        }
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`Failed to reply to tweet: ${error.message}`);
        }
        throw new Error('Failed to reply to tweet: Unknown error occurred');
    }
}

export async function handleDeleteTweet(
    client: ApiV2Client | TwikitBridgeClient,
    { tweetId }: { tweetId: string }
): Promise<HandlerResponse> {
    try {
        if (isApiV2Client(client)) {
            await client.v2.deleteTweet(tweetId);
            return createResponse(`Successfully deleted tweet: ${tweetId}`);
        } else {
            const result = await (client as TwikitBridgeClient).sendCommand('delete_tweet', { id: tweetId });
             // Twikit delete_tweet returns the deleted tweet object or similar.
            return createResponse(`Successfully deleted tweet (via Twikit): ${tweetId}`);
        }
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`Failed to delete tweet: ${error.message}`);
        }
        throw new Error('Failed to delete tweet: Unknown error occurred');
    }
}

// Renamed GetUserTimelineArgs to avoid conflict with the one in src/types.ts
// This handler needs to be aligned with types.ts GetUserTimelineArgs which uses username, not userId.
export const handleGetUserTimeline = async (
    client: ApiV2Client | TwikitBridgeClient,
    { userId, username, maxResults = 10, tweetFields = ['created_at', 'public_metrics', 'author_id'], expansions = ['author_id' as TTweetv2Expansion], userFields = ['username' as TTweetv2UserField] }: AppGetUserTimelineArgs & { userId?: string; username?: string }
): Promise<HandlerResponse> => {
    try {
        if (isApiV2Client(client)) {
            let effectiveUserId = userId;
            if (!effectiveUserId && username) {
                const userLookup = await client.v2.userByUsername(username);
                if (!userLookup.data) throw new Error(`User ${username} not found for APIv2 client.`);
                effectiveUserId = userLookup.data.id;
            }
            if (!effectiveUserId) throw new Error ('User ID or username is required for APIv2 client timeline.');

            const tweets = await client.v2.userTimeline(effectiveUserId, {
                max_results: maxResults,
                'tweet.fields': tweetFields.join(','),
                'expansions': expansions.join(','),
                'user.fields': userFields.join(',')
            });
            return createResponse(`User timeline: ${JSON.stringify(tweets.data, null, 2)}`);
        } else {
            let effectiveUserId = userId;
            if(!effectiveUserId && username) {
                // TwikitBridgeClient needs a method like getUserByScreenName to convert username to ID first
                const userObj = await (client as TwikitBridgeClient).getUserByScreenName(username);
                if (!userObj || !userObj.id) throw new Error(`User ${username} not found via Twikit.`);
                effectiveUserId = userObj.id;
            }
            if (!effectiveUserId) throw new Error ('User ID or username is required for Twikit client timeline.');

            // Assuming TwikitBridgeClient.getUserTweets takes userId, type, count, cursor
            const result = await (client as TwikitBridgeClient).getUserTweets(effectiveUserId, 'Tweets', maxResults);
            return createResponse(`User timeline (via Twikit): ${JSON.stringify(result, null, 2)}`);
        }
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`Failed to get user timeline: ${error.message}`);
        }
        throw new Error('Failed to get user timeline: Unknown error occurred');
    }
};

// Add other tweet-related handlers... 