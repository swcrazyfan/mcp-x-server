import { TwitterClient } from '../twitterClient.js';

export async function handleLikeTweet(
    client: TwitterClient,
    tweetId: string
) {
    try {
        const userId = await client.v2.me().then(response => response.data.id);
        await client.v2.like(userId, tweetId);
        return {
            content: [{ type: 'text', text: `Successfully liked tweet: ${tweetId}` }],
        };
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`Failed to like tweet: ${error.message}`);
        }
        throw error;
    }
}

export async function handleUnlikeTweet(
    client: TwitterClient,
    tweetId: string
) {
    try {
        const userId = await client.v2.me().then(response => response.data.id);
        await client.v2.unlike(userId, tweetId);
        return {
            content: [{ type: 'text', text: `Successfully unliked tweet: ${tweetId}` }],
        };
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`Failed to unlike tweet: ${error.message}`);
        }
        throw error;
    }
}

export async function handleRetweet(
    client: TwitterClient,
    tweetId: string
) {
    try {
        const userId = await client.v2.me().then(response => response.data.id);
        await client.v2.retweet(userId, tweetId);
        return {
            content: [{ type: 'text', text: `Successfully retweeted tweet: ${tweetId}` }],
        };
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`Failed to retweet: ${error.message}`);
        }
        throw error;
    }
}

export async function handleUndoRetweet(
    client: TwitterClient,
    tweetId: string
) {
    try {
        const userId = await client.v2.me().then(response => response.data.id);
        await client.v2.unretweet(userId, tweetId);
        return {
            content: [{ type: 'text', text: `Successfully undid retweet: ${tweetId}` }],
        };
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`Failed to undo retweet: ${error.message}`);
        }
        throw error;
    }
} 