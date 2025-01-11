import { TwitterClient } from '../twitterClient.js';
import { UserV2, TTweetv2UserField } from 'twitter-api-v2';
import { 
    HandlerResponse, 
    TwitterHandler,
    UserHandlerArgs 
} from '../types/handlers.js';
import { createResponse } from '../utils/response.js';

interface GetUserInfoArgs extends UserHandlerArgs {
    fields?: TTweetv2UserField[];
}

interface GetUserTimelineArgs extends UserHandlerArgs {
    maxResults?: number;
    tweetFields?: string[];
}

export const handleGetUserInfo: TwitterHandler<GetUserInfoArgs> = async (
    client: TwitterClient,
    { username, fields }: GetUserInfoArgs
): Promise<HandlerResponse> => {
    const user = await client.v2.userByUsername(
        username,
        { 
            'user.fields': fields || ['description', 'public_metrics', 'profile_image_url', 'verified'] as TTweetv2UserField[]
        }
    );
    
    if (!user.data) {
        throw new Error(`User not found: ${username}`);
    }

    return createResponse(`User info: ${JSON.stringify(user.data, null, 2)}`);
};

export const handleGetUserTimeline: TwitterHandler<GetUserTimelineArgs> = async (
    client: TwitterClient,
    { username, maxResults, tweetFields }: GetUserTimelineArgs
): Promise<HandlerResponse> => {
    const userResponse = await client.v2.userByUsername(username);
    if (!userResponse.data) {
        throw new Error(`User not found: ${username}`);
    }
    
    const tweets = await client.v2.userTimeline(userResponse.data.id, {
        max_results: maxResults,
        'tweet.fields': tweetFields?.join(',')
    });
    
    return createResponse(`User timeline: ${JSON.stringify(tweets.data, null, 2)}`);
};

export const handleFollowUser: TwitterHandler<UserHandlerArgs> = async (
    client: TwitterClient,
    { username }: UserHandlerArgs
): Promise<HandlerResponse> => {
    try {
        const userId = await client.v2.me().then(response => response.data.id);
        const targetUser = await client.v2.userByUsername(username);
        
        if (!targetUser.data) {
            throw new Error(`User not found: ${username}`);
        }
        
        await client.v2.follow(userId, targetUser.data.id);
        return createResponse(`Successfully followed user: ${username}`);
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`Failed to follow user: ${error.message}`);
        }
        throw error;
    }
};

export const handleUnfollowUser: TwitterHandler<UserHandlerArgs> = async (
    client: TwitterClient,
    { username }: UserHandlerArgs
): Promise<HandlerResponse> => {
    try {
        const userId = await client.v2.me().then(response => response.data.id);
        const targetUser = await client.v2.userByUsername(username);
        
        if (!targetUser.data) {
            throw new Error(`User not found: ${username}`);
        }
        
        await client.v2.unfollow(userId, targetUser.data.id);
        return createResponse(`Successfully unfollowed user: ${username}`);
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`Failed to unfollow user: ${error.message}`);
        }
        throw error;
    }
}; 