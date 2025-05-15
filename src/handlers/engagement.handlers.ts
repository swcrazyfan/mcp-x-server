import { TwitterClient as ApiV2Client } from '../client/twitter.js';
import { TwikitBridgeClient } from '../client/twikitBridgeClient.js';
import { UserV2 } from 'twitter-api-v2';
import { 
    HandlerResponse, 
    TwitterHandler 
} from '../types/handlers.js';
import { createResponse } from '../utils/response.js';

interface TweetEngagementArgs {
    tweetId: string;
}

interface GetRetweetsArgs extends TweetEngagementArgs {
    maxResults?: number;
    userFields?: string[];
}

interface GetLikedTweetsArgs {
    userId: string;
    maxResults?: number;
    tweetFields?: string[];
}

// Type guard to check client type
function isApiV2Client(client: ApiV2Client | TwikitBridgeClient): client is ApiV2Client {
    return client instanceof ApiV2Client;
}

export async function handleLikeTweet(
    client: ApiV2Client | TwikitBridgeClient,
    { tweetId }: { tweetId: string }
): Promise<HandlerResponse> {
    try {
        if (isApiV2Client(client)) {
            const { data } = await client.v2.like(process.env.X_USER_ID!, tweetId);
            return createResponse(`Tweet ${tweetId} liked: ${data.liked}`);
        } else {
            const result = await client.favoriteTweet(tweetId);
            return createResponse(`Tweet ${tweetId} liked (via Twikit): ${result.favorited !== undefined ? result.favorited : JSON.stringify(result)}`);
        }
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`Failed to like tweet: ${error.message}`);
        }
        throw new Error('Failed to like tweet: Unknown error occurred');
    }
}

export async function handleUnlikeTweet(
    client: ApiV2Client | TwikitBridgeClient,
    { tweetId }: { tweetId: string }
): Promise<HandlerResponse> {
    try {
        if (isApiV2Client(client)) {
            const { data } = await client.v2.unlike(process.env.X_USER_ID!, tweetId);
            return createResponse(`Tweet ${tweetId} unliked: ${data.liked}`);
        } else {
            const result = await client.unfavoriteTweet(tweetId);
            return createResponse(`Tweet ${tweetId} unliked (via Twikit): ${result.favorited !== undefined ? !result.favorited : JSON.stringify(result)}`);
        }
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`Failed to unlike tweet: ${error.message}`);
        }
        throw new Error('Failed to unlike tweet: Unknown error occurred');
    }
}

export async function handleRetweet(
    client: ApiV2Client | TwikitBridgeClient,
    { tweetId }: { tweetId: string }
): Promise<HandlerResponse> {
    try {
        if (isApiV2Client(client)) {
            const { data } = await client.v2.retweet(process.env.X_USER_ID!, tweetId);
            return createResponse(`Tweet ${tweetId} retweeted: ${data.retweeted}`);
        } else {
            const result = await client.retweetTweet(tweetId); // Assuming method name retweetTweet
            return createResponse(`Tweet ${tweetId} retweeted (via Twikit): ${result.retweeted !== undefined ? result.retweeted : JSON.stringify(result)}`);
        }
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`Failed to retweet: ${error.message}`);
        }
        throw new Error('Failed to retweet: Unknown error occurred');
    }
}

export async function handleUndoRetweet(
    client: ApiV2Client | TwikitBridgeClient,
    { tweetId }: { tweetId: string }
): Promise<HandlerResponse> {
    try {
        if (isApiV2Client(client)) {
            const { data } = await client.v2.unretweet(process.env.X_USER_ID!, tweetId);
            return createResponse(`Retweet undone for tweet ${tweetId}: ${data.retweeted}`);
        } else {
            const result = await client.deleteRetweet(tweetId); // Assuming method name deleteRetweet
            return createResponse(`Retweet undone for tweet ${tweetId} (via Twikit): ${result.retweeted !== undefined ? !result.retweeted : JSON.stringify(result)}`);
        }
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`Failed to undo retweet: ${error.message}`);
        }
        throw new Error('Failed to undo retweet: Unknown error occurred');
    }
}

export async function handleGetRetweets(
    client: ApiV2Client | TwikitBridgeClient,
    { tweetId, maxResults = 10 }: { tweetId: string; maxResults?: number }
): Promise<HandlerResponse> {
    try {
        if (isApiV2Client(client)) {
            const retweets = await client.v2.tweetRetweetedBy(tweetId, { 'max_results': maxResults });
            return createResponse(`Retweets for ${tweetId}: ${JSON.stringify(retweets.data, null, 2)}`);
        } else {
            const result = await client.getRetweeters(tweetId, maxResults);
            return createResponse(`Retweets for ${tweetId} (via Twikit): ${JSON.stringify(result, null, 2)}`);
        }
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`Failed to get retweets: ${error.message}`);
        }
        throw new Error('Failed to get retweets: Unknown error occurred');
    }
}

export async function handleGetLikedTweets(
    client: ApiV2Client | TwikitBridgeClient,
    { userId, maxResults = 10 }: { userId: string; maxResults?: number }
): Promise<HandlerResponse> {
    try {
        if (isApiV2Client(client)) {
            const likedTweets = await client.v2.userLikedTweets(userId, { 'max_results': maxResults });
            return createResponse(`Liked tweets for user ${userId}: ${JSON.stringify(likedTweets.data, null, 2)}`);
        } else {
            // Twikit client.get_user_favorites(user_id, count, cursor)
            const result = await client.getUserFavorites(userId, maxResults);
            return createResponse(`Liked tweets for user ${userId} (via Twikit): ${JSON.stringify(result, null, 2)}`);
        }
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`Failed to get liked tweets: ${error.message}`);
        }
        throw new Error('Failed to get liked tweets: Unknown error occurred');
    }
} 