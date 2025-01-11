import { TwitterClient } from '../twitterClient.js';
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

export const handleLikeTweet: TwitterHandler<TweetEngagementArgs> = async (
    client: TwitterClient,
    { tweetId }: TweetEngagementArgs
): Promise<HandlerResponse> => {
    try {
        const { data: { id: userId } } = await client.v2.me();
        await client.v2.like(userId, tweetId);
        return createResponse(`Successfully liked tweet: ${tweetId}`);
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`Failed to like tweet: ${error.message}`);
        }
        throw error;
    }
};

export const handleUnlikeTweet: TwitterHandler<TweetEngagementArgs> = async (
    client: TwitterClient,
    { tweetId }: TweetEngagementArgs
): Promise<HandlerResponse> => {
    try {
        const userId = await client.v2.me().then(response => response.data.id);
        await client.v2.unlike(userId, tweetId);
        return createResponse(`Successfully unliked tweet: ${tweetId}`);
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`Failed to unlike tweet: ${error.message}`);
        }
        throw error;
    }
};

export const handleRetweet: TwitterHandler<TweetEngagementArgs> = async (
    client: TwitterClient,
    { tweetId }: TweetEngagementArgs
): Promise<HandlerResponse> => {
    try {
        const userId = await client.v2.me().then(response => response.data.id);
        await client.v2.retweet(userId, tweetId);
        return createResponse(`Successfully retweeted tweet: ${tweetId}`);
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`Failed to retweet: ${error.message}`);
        }
        throw error;
    }
};

export const handleUndoRetweet: TwitterHandler<TweetEngagementArgs> = async (
    client: TwitterClient,
    { tweetId }: TweetEngagementArgs
): Promise<HandlerResponse> => {
    try {
        const userId = await client.v2.me().then(response => response.data.id);
        await client.v2.unretweet(userId, tweetId);
        return createResponse(`Successfully undid retweet: ${tweetId}`);
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`Failed to undo retweet: ${error.message}`);
        }
        throw error;
    }
}; 