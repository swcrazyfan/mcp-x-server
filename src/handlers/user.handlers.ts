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

interface GetFollowersArgs extends UserHandlerArgs {
    maxResults?: number;
    userFields?: string[];
}

interface GetFollowingArgs extends UserHandlerArgs {
    maxResults?: number;
    userFields?: string[];
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

export const handleGetFollowers: TwitterHandler<GetFollowersArgs> = async (
    client: TwitterClient,
    { username, maxResults, userFields }: GetFollowersArgs
): Promise<HandlerResponse> => {
    try {
        const user = await client.v2.userByUsername(username);
        if (!user.data) {
            throw new Error(`User not found: ${username}`);
        }

        const followers = await client.v2.followers(user.data.id, {
            max_results: maxResults,
            'user.fields': userFields?.join(',') || 'description,public_metrics'
        });

        if (!followers.data) {
            return createResponse(`No followers found for user: ${username}`);
        }

        return createResponse(`Followers for ${username}: ${JSON.stringify(followers.data, null, 2)}`);
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`Failed to get followers: ${error.message}`);
        }
        throw error;
    }
};

export const handleGetFollowing: TwitterHandler<GetFollowingArgs> = async (
    client: TwitterClient,
    { username, maxResults, userFields }: GetFollowingArgs
): Promise<HandlerResponse> => {
    try {
        const user = await client.v2.userByUsername(username);
        if (!user.data) {
            throw new Error(`User not found: ${username}`);
        }

        const following = await client.v2.following(user.data.id, {
            max_results: maxResults,
            'user.fields': userFields?.join(',') || 'description,profile_image_url,public_metrics,verified'
        });

        if (!following.data || following.data.length === 0) {
            return createResponse(`User ${username} is not following anyone`);
        }

        return createResponse(`Users followed by ${username}: ${JSON.stringify(following.data, null, 2)}`);
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`Failed to get following: ${error.message}`);
        }
        throw error;
    }
}; 