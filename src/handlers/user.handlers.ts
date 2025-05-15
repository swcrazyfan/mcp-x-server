import { TwitterClient as ApiV2Client } from '../client/twitter.js';
import { TwikitBridgeClient } from '../client/twikitBridgeClient.js';
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

// Type guard to check client type
function isApiV2Client(client: ApiV2Client | TwikitBridgeClient): client is ApiV2Client {
    return client instanceof ApiV2Client;
}

export async function handleGetUserInfo(
    client: ApiV2Client | TwikitBridgeClient,
    { username }: { username: string }
): Promise<HandlerResponse> {
    try {
        if (isApiV2Client(client)) {
            const user = await client.v2.userByUsername(username, { 'user.fields': 'public_metrics,profile_image_url,description,verified,created_at' });
            return createResponse(`User info for ${username}: ${JSON.stringify(user.data, null, 2)}`);
        } else {
            const result = await client.getUserByScreenName(username);
            return createResponse(`User info for ${username} (via Twikit): ${JSON.stringify(result, null, 2)}`);
        }
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`Failed to get user info for ${username}: ${error.message}`);
        }
        throw new Error('Failed to get user info: Unknown error occurred');
    }
}

export async function handleFollowUser(
    client: ApiV2Client | TwikitBridgeClient,
    { username }: { username: string }
): Promise<HandlerResponse> {
    try {
        if (isApiV2Client(client)) {
            const userToFollow = await client.v2.userByUsername(username);
            if (!userToFollow.data) throw new Error(`User ${username} not found.`);
            const { data } = await client.v2.follow(process.env.X_USER_ID!, userToFollow.data.id);
            return createResponse(`Followed ${username}: ${data.following}`);
        } else {
            // Twikit follow method usually takes user_id. Need to get user_id from username first.
            const user = await client.getUserByScreenName(username);
            if (!user || !user.id) throw new Error(`User ${username} not found via Twikit.`);
            const result = await client.followUser(user.id);
            return createResponse(`Followed ${username} (via Twikit): ${result.following !== undefined ? result.following : JSON.stringify(result)}`);
        }
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`Failed to follow user ${username}: ${error.message}`);
        }
        throw new Error('Failed to follow user: Unknown error occurred');
    }
}

export async function handleUnfollowUser(
    client: ApiV2Client | TwikitBridgeClient,
    { username }: { username: string }
): Promise<HandlerResponse> {
    try {
        if (isApiV2Client(client)) {
            const userToUnfollow = await client.v2.userByUsername(username);
            if (!userToUnfollow.data) throw new Error(`User ${username} not found.`);
            const { data } = await client.v2.unfollow(process.env.X_USER_ID!, userToUnfollow.data.id);
            return createResponse(`Unfollowed ${username}: ${data.following}`);
        } else {
            const user = await client.getUserByScreenName(username);
            if (!user || !user.id) throw new Error(`User ${username} not found via Twikit.`);
            const result = await client.unfollowUser(user.id);
            return createResponse(`Unfollowed ${username} (via Twikit): ${result.following !== undefined ? !result.following : JSON.stringify(result)}`);
        }
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`Failed to unfollow user ${username}: ${error.message}`);
        }
        throw new Error('Failed to unfollow user: Unknown error occurred');
    }
}

export async function handleGetFollowers(
    client: ApiV2Client | TwikitBridgeClient,
    { username, maxResults = 10 }: { username: string; maxResults?: number }
): Promise<HandlerResponse> {
    try {
        if (isApiV2Client(client)) {
            const user = await client.v2.userByUsername(username);
            if (!user.data) throw new Error(`User ${username} not found.`);
            const followers = await client.v2.followers(user.data.id, { 'max_results': maxResults, 'user.fields': 'username,public_metrics' });
            return createResponse(`Followers for ${username}: ${JSON.stringify(followers.data, null, 2)}`);
        } else {
            const user = await client.getUserByScreenName(username);
            if (!user || !user.id) throw new Error(`User ${username} not found via Twikit.`);
            const result = await client.getUserFollowers(user.id, maxResults);
            return createResponse(`Followers for ${username} (via Twikit): ${JSON.stringify(result, null, 2)}`);
        }
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`Failed to get followers for ${username}: ${error.message}`);
        }
        throw new Error('Failed to get followers: Unknown error occurred');
    }
}

export async function handleGetFollowing(
    client: ApiV2Client | TwikitBridgeClient,
    { username, maxResults = 10 }: { username: string; maxResults?: number }
): Promise<HandlerResponse> {
    try {
        if (isApiV2Client(client)) {
            const user = await client.v2.userByUsername(username);
            if (!user.data) throw new Error(`User ${username} not found.`);
            const following = await client.v2.following(user.data.id, { 'max_results': maxResults, 'user.fields': 'username,public_metrics' });
            return createResponse(`Following for ${username}: ${JSON.stringify(following.data, null, 2)}`);
        } else {
            const user = await client.getUserByScreenName(username);
            if (!user || !user.id) throw new Error(`User ${username} not found via Twikit.`);
            const result = await client.getUserFollowing(user.id, maxResults);
            return createResponse(`Following for ${username} (via Twikit): ${JSON.stringify(result, null, 2)}`);
        }
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`Failed to get following for ${username}: ${error.message}`);
        }
        throw new Error('Failed to get following: Unknown error occurred');
    }
} 