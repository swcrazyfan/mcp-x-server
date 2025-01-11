import { TwitterClient } from '../twitterClient.js';
import { promises as fs } from 'fs';
import { 
    HandlerResponse, 
    TwitterHandler,
    TweetHandlerArgs,
    MediaTweetHandlerArgs 
} from '../types/handlers.js';

export const handlePostTweet: TwitterHandler<TweetHandlerArgs> = async (
    client: TwitterClient,
    { text }: TweetHandlerArgs
): Promise<HandlerResponse> => {
    const tweet = await client.v2.tweet({ text });
    return {
        content: [{ type: 'text', text: `Tweet posted with id: ${tweet.data.id}` }],
        tools: []
    };
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

        return {
            content: [{ type: 'text', text: `Tweet posted with media, id: ${tweet.data.id}` }],
            tools: []
        };
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`Failed to post tweet with media: ${error.message}`);
        }
        throw error;
    }
};

// Add other tweet-related handlers... 