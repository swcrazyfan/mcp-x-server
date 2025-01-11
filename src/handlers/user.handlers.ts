import { TwitterClient } from '../twitterClient.js';
import { UserV2, UserV2Fields } from 'twitter-api-v2';

export async function handleGetUserInfo(
    client: TwitterClient,
    username: string,
    fields?: UserV2Fields[]
) {
    const user = await client.v2.userByUsername(
        username,
        { 
            'user.fields': fields || ['description', 'public_metrics', 'profile_image_url', 'verified']
        }
    );
    
    if (!user.data) {
        throw new Error(`User not found: ${username}`);
    }

    return {
        content: [{ 
            type: 'text', 
            text: `User info: ${JSON.stringify(user.data, null, 2)}` 
        }],
    };
}

export async function handleGetUserTimeline(
    client: TwitterClient,
    username: string
) {
    const userResponse = await client.v2.userByUsername(username);
    if (!userResponse.data) {
        throw new Error(`User not found: ${username}`);
    }
    
    const tweets = await client.v2.userTimeline(userResponse.data.id);
    return {
        content: [{ 
            type: 'text', 
            text: `User timeline: ${JSON.stringify(tweets.data, null, 2)}` 
        }],
    };
}

export async function handleFollowUser(
    client: TwitterClient,
    username: string
) {
    try {
        const userId = await client.v2.me().then(response => response.data.id);
        const targetUser = await client.v2.userByUsername(username);
        
        if (!targetUser.data) {
            throw new Error(`User not found: ${username}`);
        }
        
        await client.v2.follow(userId, targetUser.data.id);
        return {
            content: [{ type: 'text', text: `Successfully followed user: ${username}` }],
        };
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`Failed to follow user: ${error.message}`);
        }
        throw error;
    }
}

export async function handleUnfollowUser(
    client: TwitterClient,
    username: string
) {
    try {
        const userId = await client.v2.me().then(response => response.data.id);
        const targetUser = await client.v2.userByUsername(username);
        
        if (!targetUser.data) {
            throw new Error(`User not found: ${username}`);
        }
        
        await client.v2.unfollow(userId, targetUser.data.id);
        return {
            content: [{ type: 'text', text: `Successfully unfollowed user: ${username}` }],
        };
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`Failed to unfollow user: ${error.message}`);
        }
        throw error;
    }
} 