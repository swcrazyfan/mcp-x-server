import { TwitterClient } from '../twitterClient.js';
import { promises as fs } from 'fs';
import { 
    HandlerResponse, 
    TwitterHandler,
    TweetHandlerArgs,
    MediaTweetHandlerArgs 
} from '../types/handlers.js';
import { createResponse } from '../utils/response.js';

export const handlePostTweet: TwitterHandler<TweetHandlerArgs> = async (
    client: TwitterClient,
    { text }: TweetHandlerArgs
): Promise<HandlerResponse> => {
    const tweet = await client.v2.tweet({ text });
    return createResponse(`Tweet posted with id: ${tweet.data.id}`);
};

export const handlePostTweetWithMedia: TwitterHandler<MediaTweetHandlerArgs> = async (
    client: TwitterClient,
    { text, mediaPath, mediaType, altText }: MediaTweetHandlerArgs
): Promise<HandlerResponse> => {
    try {
        const mediaBuffer = await fs.readFile(mediaPath);
        const mediaId = await client.v1.uploadMedia(mediaBuffer, { mimeType: mediaType });
        
        if (altText) {
            await client.v1.createMediaMetadata(mediaId, { alt_text: { text: altText } });
        }

        const tweet = await client.v2.tweet({
            text,
            media: { media_ids: [mediaId] }
        });

        return createResponse(`Tweet posted with media, id: ${tweet.data.id}`);
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`Failed to post tweet with media: ${error.message}`);
        }
        throw error;
    }
};

interface GetTweetArgs {
    tweetId: string;
    tweetFields?: string[];
}

interface ReplyTweetArgs {
    tweetId: string;
    text: string;
}

interface DeleteTweetArgs {
    tweetId: string;
}

export const handleGetTweetById: TwitterHandler<GetTweetArgs> = async (
    client: TwitterClient,
    { tweetId, tweetFields }: GetTweetArgs
): Promise<HandlerResponse> => {
    try {
        const tweet = await client.v2.singleTweet(tweetId, {
            'tweet.fields': tweetFields?.join(',') || 'created_at,public_metrics,author_id'
        });

        if (!tweet.data) {
            throw new Error(`Tweet not found: ${tweetId}`);
        }

        return createResponse(`Tweet details: ${JSON.stringify(tweet.data, null, 2)}`);
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`Failed to get tweet: ${error.message}`);
        }
        throw error;
    }
};

export const handleReplyToTweet: TwitterHandler<ReplyTweetArgs> = async (
    client: TwitterClient,
    { tweetId, text }: ReplyTweetArgs
): Promise<HandlerResponse> => {
    try {
        const reply = await client.v2.reply(text, tweetId);
        return createResponse(`Successfully replied to tweet ${tweetId}. Reply ID: ${reply.data.id}`);
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`Failed to reply to tweet: ${error.message}`);
        }
        throw error;
    }
};

export const handleDeleteTweet: TwitterHandler<DeleteTweetArgs> = async (
    client: TwitterClient,
    { tweetId }: DeleteTweetArgs
): Promise<HandlerResponse> => {
    try {
        await client.v2.deleteTweet(tweetId);
        return createResponse(`Successfully deleted tweet: ${tweetId}`);
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`Failed to delete tweet: ${error.message}`);
        }
        throw error;
    }
};

// Add other tweet-related handlers... 