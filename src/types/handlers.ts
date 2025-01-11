import { TwitterClient } from '../twitterClient.js';
import { z } from 'zod';

export interface HandlerResponse {
    content: Array<{
        type: string;
        text: string;
    }>;
    tools: Array<{
        name: string;
        description?: string;
        inputSchema: {
            type: 'object';
            properties?: Record<string, unknown>;
        };
    }>;
    _meta?: {
        [key: string]: unknown;
    };
}

export interface TwitterHandler<T> {
    (client: TwitterClient, args: T): Promise<HandlerResponse>;
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

export interface GetUserInfoArgs extends UserHandlerArgs {
    fields?: string[];
}

export interface GetUserTimelineArgs extends UserHandlerArgs {
    maxResults?: number;
    tweetFields?: string[];
}

export interface TweetEngagementArgs {
    tweetId: string;
}

export interface ListHandlerArgs {
    listId: string;
}

export interface ListCreateArgs {
    name: string;
    description: string;
    isPrivate: boolean;
}

export interface ListMemberArgs extends ListHandlerArgs {
    username: string;
}

export interface GetListMembersArgs extends ListHandlerArgs {
    maxResults?: number;
    userFields?: string[];
} 