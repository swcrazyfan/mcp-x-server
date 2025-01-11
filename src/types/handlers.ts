import { TwitterClient } from '../twitterClient.js';
import { z } from 'zod';

export interface HandlerResponse {
    content: Array<{
        type: string;
        text: string;
    }>;
    tools?: z.infer<typeof z.array(z.object({
        name: z.string(),
        description: z.string().optional(),
        inputSchema: z.object({
            type: z.literal('object'),
            properties: z.record(z.any()).optional()
        })
    }))>;
}

export interface TwitterHandler<T> {
    (client: TwitterClient, ...args: any[]): Promise<HandlerResponse>;
}

export interface TweetHandlerArgs {
    text: string;
}

export interface MediaTweetHandlerArgs extends TweetHandlerArgs {
    mediaPath: string;
    mediaType: string;
    altText?: string;
}

export interface UserHandlerArgs {
    username: string;
}

export interface ListHandlerArgs {
    listId: string;
}

export interface ListCreateArgs {
    name: string;
    description: string;
    isPrivate: boolean;
} 