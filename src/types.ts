export interface PostTweetArgs {
    text: string;
}

export interface PostTweetWithMediaArgs {
    text: string;
    mediaPath: string;
    mediaType: 'image/jpeg' | 'image/png' | 'image/gif' | 'video/mp4';
    altText?: string;
}

export interface SearchTweetsArgs {
    query: string;
    since?: string;
    until?: string;
    tweetFields?: string[];
}

export interface ReplyToTweetArgs {
    tweetId: string;
    text: string;
}

export interface GetUserTimelineArgs {
    username: string;
    maxResults?: number;
    paginationToken?: string;
    excludeReplies?: boolean;
    excludeRetweets?: boolean;
    startTime?: string;
    endTime?: string;
    tweetFields?: string[];
}

export interface GetTweetByIdArgs {
    tweetId: string;
}

export interface GetUserInfoArgs {
    username: string;
}

export interface GetTweetsByIdsArgs {
    tweetIds: string[];
    tweetFields?: string[];
}

export interface LikeTweetArgs {
    tweetId: string;
}

export interface UnlikeTweetArgs {
    tweetId: string;
}

export interface GetLikedTweetsArgs {
    userId: string;
    maxResults?: number;
    tweetFields?: string[];
}

export interface RetweetArgs {
    tweetId: string;
}

export interface UndoRetweetArgs {
    tweetId: string;
}

export interface GetRetweetsArgs {
    tweetId: string;
    maxResults?: number;
    userFields?: string[];
}

export interface FollowUserArgs {
    username: string;
}

export interface UnfollowUserArgs {
    username: string;
}

export interface GetFollowersArgs {
    username: string;
    maxResults?: number;
    userFields?: string[];
}

export interface GetFollowingArgs {
    username: string;
    maxResults?: number;
    userFields?: string[];
}

export interface CreateListArgs {
    name: string;
    description?: string;
    private?: boolean;
}

export interface AddUserToListArgs {
    listId: string;
    username: string;
}

export interface RemoveUserFromListArgs {
    listId: string;
    username: string;
}

export interface GetListMembersArgs {
    listId: string;
    maxResults?: number;
    userFields?: string[];
}

export interface GetUserListsArgs {
    username: string;
    maxResults?: number;
    listFields?: string[];
}

export interface SendDirectMessageArgs {
    recipientUsername: string;
    text: string;
    mediaPath?: string;
    mediaType?: 'image/jpeg' | 'image/png' | 'image/gif' | 'video/mp4';
}

export interface GetDirectMessagesArgs {
    maxResults?: number;
    paginationToken?: string;
}

export interface GetDirectMessageByIdArgs {
    messageId: string;
}

export interface DeleteDirectMessageArgs {
    messageId: string;
}

export interface GetTweetAnalyticsArgs {
    tweetId: string;
    includeNonPublicMetrics?: boolean;
    includeOrganicMetrics?: boolean;
    includePromotedMetrics?: boolean;
}

export interface GetUserAnalyticsArgs {
    username: string;
    startTime?: string;
    endTime?: string;
    granularity?: 'day' | 'hour';
}

export interface GetHashtagAnalyticsArgs {
    hashtag: string;
    startTime?: string;
    endTime?: string;
    maxResults?: number;
}

export function assertPostTweetArgs(args: unknown): asserts args is PostTweetArgs {
    if (typeof args !== 'object' || args === null) {
        throw new Error('Invalid arguments: expected object');
    }
    if (!('text' in args) || typeof (args as any).text !== 'string') {
        throw new Error('Invalid arguments: expected text string');
    }
}

export function assertPostTweetWithMediaArgs(args: unknown): asserts args is PostTweetWithMediaArgs {
    if (typeof args !== 'object' || args === null) {
        throw new Error('Invalid arguments: expected object');
    }
    if (!('text' in args) || typeof (args as any).text !== 'string') {
        throw new Error('Invalid arguments: expected text string');
    }
    if (!('mediaPath' in args) || typeof (args as any).mediaPath !== 'string') {
        throw new Error('Invalid arguments: expected mediaPath string');
    }
    if (!('mediaType' in args) || typeof (args as any).mediaType !== 'string') {
        throw new Error('Invalid arguments: expected mediaType string');
    }
    const validMediaTypes = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4'];
    if (!validMediaTypes.includes((args as any).mediaType)) {
        throw new Error(`Invalid arguments: mediaType must be one of: ${validMediaTypes.join(', ')}`);
    }
    if ('altText' in args && typeof (args as any).altText !== 'string') {
        throw new Error('Invalid arguments: expected altText to be a string');
    }
}

export function assertSearchTweetsArgs(args: unknown): asserts args is SearchTweetsArgs {
    if (typeof args !== 'object' || args === null) {
        throw new Error('Invalid arguments: expected object');
    }
    if (!('query' in args) || typeof (args as any).query !== 'string') {
        throw new Error('Invalid arguments: expected query string');
    }
    if ('since' in args && typeof (args as any).since !== 'string') {
        throw new Error('Invalid arguments: expected since to be an ISO 8601 date string');
    }
    if ('until' in args && typeof (args as any).until !== 'string') {
        throw new Error('Invalid arguments: expected until to be an ISO 8601 date string');
    }
    if ('tweetFields' in args) {
        if (!Array.isArray((args as any).tweetFields)) {
            throw new Error('Invalid arguments: expected tweetFields to be an array');
        }
        for (const field of (args as any).tweetFields) {
            if (typeof field !== 'string') {
                throw new Error('Invalid arguments: expected tweetFields to be an array of strings');
            }
        }
    }
}

export function assertReplyToTweetArgs(args: unknown): asserts args is ReplyToTweetArgs {
    if (typeof args !== 'object' || args === null) {
        throw new Error('Invalid arguments: expected object');
    }
    if (!('tweetId' in args) || typeof (args as any).tweetId !== 'string') {
        throw new Error('Invalid arguments: expected tweetId string');
    }
    if (!('text' in args) || typeof (args as any).text !== 'string') {
        throw new Error('Invalid arguments: expected text string');
    }
}

export function assertGetUserTimelineArgs(args: unknown): asserts args is GetUserTimelineArgs {
    if (typeof args !== 'object' || args === null) {
        throw new Error('Invalid arguments: expected object');
    }
    if (!('username' in args) || typeof (args as any).username !== 'string') {
        throw new Error('Invalid arguments: expected username string');
    }
    if ('maxResults' in args) {
        const maxResults = (args as any).maxResults;
        if (typeof maxResults !== 'number' || maxResults < 1 || maxResults > 100) {
            throw new Error('Invalid arguments: maxResults must be a number between 1 and 100');
        }
    }
    if ('paginationToken' in args && typeof (args as any).paginationToken !== 'string') {
        throw new Error('Invalid arguments: expected paginationToken string');
    }
    if ('excludeReplies' in args && typeof (args as any).excludeReplies !== 'boolean') {
        throw new Error('Invalid arguments: expected excludeReplies boolean');
    }
    if ('excludeRetweets' in args && typeof (args as any).excludeRetweets !== 'boolean') {
        throw new Error('Invalid arguments: expected excludeRetweets boolean');
    }
    if ('startTime' in args && typeof (args as any).startTime !== 'string') {
        throw new Error('Invalid arguments: expected startTime to be an ISO 8601 date string');
    }
    if ('endTime' in args && typeof (args as any).endTime !== 'string') {
        throw new Error('Invalid arguments: expected endTime to be an ISO 8601 date string');
    }
    if ('tweetFields' in args) {
        if (!Array.isArray((args as any).tweetFields)) {
            throw new Error('Invalid arguments: expected tweetFields to be an array');
        }
        for (const field of (args as any).tweetFields) {
            if (typeof field !== 'string') {
                throw new Error('Invalid arguments: expected tweetFields to be an array of strings');
            }
        }
    }
}

export function assertGetTweetByIdArgs(args: unknown): asserts args is GetTweetByIdArgs {
    if (typeof args !== 'object' || args === null) {
        throw new Error('Invalid arguments: expected object');
    }
    if (!('tweetId' in args) || typeof (args as any).tweetId !== 'string') {
        throw new Error('Invalid arguments: expected tweetId string');
    }
}

export function assertGetUserInfoArgs(args: unknown): asserts args is GetUserInfoArgs {
    if (typeof args !== 'object' || args === null) {
        throw new Error('Invalid arguments: expected object');
    }
    if (!('username' in args) || typeof (args as any).username !== 'string') {
        throw new Error('Invalid arguments: expected username string');
    }
}

export function assertGetTweetsByIdsArgs(args: unknown): asserts args is GetTweetsByIdsArgs {
    if (typeof args !== 'object' || args === null) {
        throw new Error('Invalid arguments: expected object');
    }
    if (!('tweetIds' in args) || !Array.isArray((args as any).tweetIds)) {
        throw new Error('Invalid arguments: expected tweetIds array');
    }
    if ((args as any).tweetIds.length === 0) {
        throw new Error('Invalid arguments: tweetIds array cannot be empty');
    }
    if ((args as any).tweetIds.length > 100) {
        throw new Error('Invalid arguments: cannot fetch more than 100 tweets at once');
    }
    for (const id of (args as any).tweetIds) {
        if (typeof id !== 'string') {
            throw new Error('Invalid arguments: expected tweetIds to be an array of strings');
        }
    }
    if ('tweetFields' in args) {
        if (!Array.isArray((args as any).tweetFields)) {
            throw new Error('Invalid arguments: expected tweetFields to be an array');
        }
        for (const field of (args as any).tweetFields) {
            if (typeof field !== 'string') {
                throw new Error('Invalid arguments: expected tweetFields to be an array of strings');
            }
        }
    }
}

export function assertLikeTweetArgs(args: unknown): asserts args is LikeTweetArgs {
    if (typeof args !== 'object' || args === null) {
        throw new Error('Invalid arguments: expected object');
    }
    if (!('tweetId' in args) || typeof (args as any).tweetId !== 'string') {
        throw new Error('Invalid arguments: expected tweetId string');
    }
}

export function assertUnlikeTweetArgs(args: unknown): asserts args is UnlikeTweetArgs {
    if (typeof args !== 'object' || args === null) {
        throw new Error('Invalid arguments: expected object');
    }
    if (!('tweetId' in args) || typeof (args as any).tweetId !== 'string') {
        throw new Error('Invalid arguments: expected tweetId string');
    }
}

export function assertGetLikedTweetsArgs(args: unknown): asserts args is GetLikedTweetsArgs {
    if (typeof args !== 'object' || args === null) {
        throw new Error('Invalid arguments: expected object');
    }
    if (!('userId' in args) || typeof (args as any).userId !== 'string') {
        throw new Error('Invalid arguments: expected userId string');
    }
    if ('maxResults' in args) {
        const maxResults = (args as any).maxResults;
        if (typeof maxResults !== 'number' || maxResults < 1 || maxResults > 100) {
            throw new Error('Invalid arguments: maxResults must be a number between 1 and 100');
        }
    }
    if ('tweetFields' in args) {
        if (!Array.isArray((args as any).tweetFields)) {
            throw new Error('Invalid arguments: expected tweetFields to be an array');
        }
        for (const field of (args as any).tweetFields) {
            if (typeof field !== 'string') {
                throw new Error('Invalid arguments: expected tweetFields to be an array of strings');
            }
        }
    }
}

export function assertRetweetArgs(args: unknown): asserts args is RetweetArgs {
    if (typeof args !== 'object' || args === null) {
        throw new Error('Invalid arguments: expected object');
    }
    if (!('tweetId' in args) || typeof (args as any).tweetId !== 'string') {
        throw new Error('Invalid arguments: expected tweetId string');
    }
}

export function assertUndoRetweetArgs(args: unknown): asserts args is UndoRetweetArgs {
    if (typeof args !== 'object' || args === null) {
        throw new Error('Invalid arguments: expected object');
    }
    if (!('tweetId' in args) || typeof (args as any).tweetId !== 'string') {
        throw new Error('Invalid arguments: expected tweetId string');
    }
}

export function assertGetRetweetsArgs(args: unknown): asserts args is GetRetweetsArgs {
    if (typeof args !== 'object' || args === null) {
        throw new Error('Invalid arguments: expected object');
    }
    if (!('tweetId' in args) || typeof (args as any).tweetId !== 'string') {
        throw new Error('Invalid arguments: expected tweetId string');
    }
    if ('maxResults' in args) {
        const maxResults = (args as any).maxResults;
        if (typeof maxResults !== 'number' || maxResults < 1 || maxResults > 100) {
            throw new Error('Invalid arguments: maxResults must be a number between 1 and 100');
        }
    }
    if ('userFields' in args) {
        if (!Array.isArray((args as any).userFields)) {
            throw new Error('Invalid arguments: expected userFields to be an array');
        }
        for (const field of (args as any).userFields) {
            if (typeof field !== 'string') {
                throw new Error('Invalid arguments: expected userFields to be an array of strings');
            }
        }
    }
}

export function assertFollowUserArgs(args: unknown): asserts args is FollowUserArgs {
    if (typeof args !== 'object' || args === null) {
        throw new Error('Invalid arguments: expected object');
    }
    if (!('username' in args) || typeof (args as any).username !== 'string') {
        throw new Error('Invalid arguments: expected username string');
    }
}

export function assertUnfollowUserArgs(args: unknown): asserts args is UnfollowUserArgs {
    if (typeof args !== 'object' || args === null) {
        throw new Error('Invalid arguments: expected object');
    }
    if (!('username' in args) || typeof (args as any).username !== 'string') {
        throw new Error('Invalid arguments: expected username string');
    }
}

export function assertGetFollowersArgs(args: unknown): asserts args is GetFollowersArgs {
    if (typeof args !== 'object' || args === null) {
        throw new Error('Invalid arguments: expected object');
    }
    if (!('username' in args) || typeof (args as any).username !== 'string') {
        throw new Error('Invalid arguments: expected username string');
    }
    if ('maxResults' in args) {
        const maxResults = (args as any).maxResults;
        if (typeof maxResults !== 'number' || maxResults < 1 || maxResults > 1000) {
            throw new Error('Invalid arguments: maxResults must be a number between 1 and 1000');
        }
    }
    if ('userFields' in args) {
        if (!Array.isArray((args as any).userFields)) {
            throw new Error('Invalid arguments: expected userFields to be an array');
        }
        for (const field of (args as any).userFields) {
            if (typeof field !== 'string') {
                throw new Error('Invalid arguments: expected userFields to be an array of strings');
            }
        }
    }
}

export function assertGetFollowingArgs(args: unknown): asserts args is GetFollowingArgs {
    if (typeof args !== 'object' || args === null) {
        throw new Error('Invalid arguments: expected object');
    }
    if (!('username' in args) || typeof (args as any).username !== 'string') {
        throw new Error('Invalid arguments: expected username string');
    }
    if ('maxResults' in args) {
        const maxResults = (args as any).maxResults;
        if (typeof maxResults !== 'number' || maxResults < 1 || maxResults > 1000) {
            throw new Error('Invalid arguments: maxResults must be a number between 1 and 1000');
        }
    }
    if ('userFields' in args) {
        if (!Array.isArray((args as any).userFields)) {
            throw new Error('Invalid arguments: expected userFields to be an array');
        }
        for (const field of (args as any).userFields) {
            if (typeof field !== 'string') {
                throw new Error('Invalid arguments: expected userFields to be an array of strings');
            }
        }
    }
}

export function assertCreateListArgs(args: unknown): asserts args is CreateListArgs {
    if (typeof args !== 'object' || args === null) {
        throw new Error('Invalid arguments: expected object');
    }
    if (!('name' in args) || typeof (args as any).name !== 'string') {
        throw new Error('Invalid arguments: expected name string');
    }
    if ('description' in args && typeof (args as any).description !== 'string') {
        throw new Error('Invalid arguments: expected description string');
    }
    if ('private' in args && typeof (args as any).private !== 'boolean') {
        throw new Error('Invalid arguments: expected private boolean');
    }
}

export function assertAddUserToListArgs(args: unknown): asserts args is AddUserToListArgs {
    if (typeof args !== 'object' || args === null) {
        throw new Error('Invalid arguments: expected object');
    }
    if (!('listId' in args) || typeof (args as any).listId !== 'string') {
        throw new Error('Invalid arguments: expected listId string');
    }
    if (!('username' in args) || typeof (args as any).username !== 'string') {
        throw new Error('Invalid arguments: expected username string');
    }
}

export function assertRemoveUserFromListArgs(args: unknown): asserts args is RemoveUserFromListArgs {
    if (typeof args !== 'object' || args === null) {
        throw new Error('Invalid arguments: expected object');
    }
    if (!('listId' in args) || typeof (args as any).listId !== 'string') {
        throw new Error('Invalid arguments: expected listId string');
    }
    if (!('username' in args) || typeof (args as any).username !== 'string') {
        throw new Error('Invalid arguments: expected username string');
    }
}

export function assertGetListMembersArgs(args: unknown): asserts args is GetListMembersArgs {
    if (typeof args !== 'object' || args === null) {
        throw new Error('Invalid arguments: expected object');
    }
    if (!('listId' in args) || typeof (args as any).listId !== 'string') {
        throw new Error('Invalid arguments: expected listId string');
    }
    if ('maxResults' in args) {
        const maxResults = (args as any).maxResults;
        if (typeof maxResults !== 'number' || maxResults < 1 || maxResults > 100) {
            throw new Error('Invalid arguments: maxResults must be a number between 1 and 100');
        }
    }
    if ('userFields' in args) {
        if (!Array.isArray((args as any).userFields)) {
            throw new Error('Invalid arguments: expected userFields to be an array');
        }
        for (const field of (args as any).userFields) {
            if (typeof field !== 'string') {
                throw new Error('Invalid arguments: expected userFields to be an array of strings');
            }
        }
    }
}

export function assertGetUserListsArgs(args: unknown): asserts args is GetUserListsArgs {
    if (typeof args !== 'object' || args === null) {
        throw new Error('Invalid arguments: expected object');
    }
    if (!('username' in args) || typeof (args as any).username !== 'string') {
        throw new Error('Invalid arguments: expected username string');
    }
    if ('maxResults' in args) {
        const maxResults = (args as any).maxResults;
        if (typeof maxResults !== 'number' || maxResults < 1 || maxResults > 100) {
            throw new Error('Invalid arguments: maxResults must be a number between 1 and 100');
        }
    }
    if ('listFields' in args) {
        if (!Array.isArray((args as any).listFields)) {
            throw new Error('Invalid arguments: expected listFields to be an array');
        }
        for (const field of (args as any).listFields) {
            if (typeof field !== 'string') {
                throw new Error('Invalid arguments: expected listFields to be an array of strings');
            }
        }
    }
}

export function assertSendDirectMessageArgs(args: unknown): asserts args is SendDirectMessageArgs {
    if (typeof args !== 'object' || args === null) {
        throw new Error('Invalid arguments: expected object');
    }
    if (!('recipientUsername' in args) || typeof (args as any).recipientUsername !== 'string') {
        throw new Error('Invalid arguments: expected recipientUsername string');
    }
    if (!('text' in args) || typeof (args as any).text !== 'string') {
        throw new Error('Invalid arguments: expected text string');
    }
    if ('mediaPath' in args) {
        if (typeof (args as any).mediaPath !== 'string') {
            throw new Error('Invalid arguments: expected mediaPath string');
        }
        if (!('mediaType' in args) || typeof (args as any).mediaType !== 'string') {
            throw new Error('Invalid arguments: mediaType is required when mediaPath is provided');
        }
        const validMediaTypes = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4'];
        if (!validMediaTypes.includes((args as any).mediaType)) {
            throw new Error(`Invalid arguments: mediaType must be one of: ${validMediaTypes.join(', ')}`);
        }
    }
}

export function assertGetDirectMessagesArgs(args: unknown): asserts args is GetDirectMessagesArgs {
    if (typeof args !== 'object' || args === null) {
        throw new Error('Invalid arguments: expected object');
    }
    if ('maxResults' in args) {
        const maxResults = (args as any).maxResults;
        if (typeof maxResults !== 'number' || maxResults < 1 || maxResults > 100) {
            throw new Error('Invalid arguments: maxResults must be a number between 1 and 100');
        }
    }
    if ('paginationToken' in args && typeof (args as any).paginationToken !== 'string') {
        throw new Error('Invalid arguments: expected paginationToken string');
    }
}

export function assertGetDirectMessageByIdArgs(args: unknown): asserts args is GetDirectMessageByIdArgs {
    if (typeof args !== 'object' || args === null) {
        throw new Error('Invalid arguments: expected object');
    }
    if (!('messageId' in args) || typeof (args as any).messageId !== 'string') {
        throw new Error('Invalid arguments: expected messageId string');
    }
}

export function assertDeleteDirectMessageArgs(args: unknown): asserts args is DeleteDirectMessageArgs {
    if (typeof args !== 'object' || args === null) {
        throw new Error('Invalid arguments: expected object');
    }
    if (!('messageId' in args) || typeof (args as any).messageId !== 'string') {
        throw new Error('Invalid arguments: expected messageId string');
    }
}

export function assertGetTweetAnalyticsArgs(args: unknown): asserts args is GetTweetAnalyticsArgs {
    if (typeof args !== 'object' || args === null) {
        throw new Error('Invalid arguments: expected object');
    }
    if (!('tweetId' in args) || typeof (args as any).tweetId !== 'string') {
        throw new Error('Invalid arguments: expected tweetId string');
    }
    if ('includeNonPublicMetrics' in args && typeof (args as any).includeNonPublicMetrics !== 'boolean') {
        throw new Error('Invalid arguments: expected includeNonPublicMetrics boolean');
    }
    if ('includeOrganicMetrics' in args && typeof (args as any).includeOrganicMetrics !== 'boolean') {
        throw new Error('Invalid arguments: expected includeOrganicMetrics boolean');
    }
    if ('includePromotedMetrics' in args && typeof (args as any).includePromotedMetrics !== 'boolean') {
        throw new Error('Invalid arguments: expected includePromotedMetrics boolean');
    }
}

export function assertGetUserAnalyticsArgs(args: unknown): asserts args is GetUserAnalyticsArgs {
    if (typeof args !== 'object' || args === null) {
        throw new Error('Invalid arguments: expected object');
    }
    if (!('username' in args) || typeof (args as any).username !== 'string') {
        throw new Error('Invalid arguments: expected username string');
    }
    if ('startTime' in args && typeof (args as any).startTime !== 'string') {
        throw new Error('Invalid arguments: expected startTime to be an ISO 8601 date string');
    }
    if ('endTime' in args && typeof (args as any).endTime !== 'string') {
        throw new Error('Invalid arguments: expected endTime to be an ISO 8601 date string');
    }
    if ('granularity' in args) {
        const granularity = (args as any).granularity;
        if (typeof granularity !== 'string' || !['day', 'hour'].includes(granularity)) {
            throw new Error('Invalid arguments: granularity must be either "day" or "hour"');
        }
    }
}

export function assertGetHashtagAnalyticsArgs(args: unknown): asserts args is GetHashtagAnalyticsArgs {
    if (typeof args !== 'object' || args === null) {
        throw new Error('Invalid arguments: expected object');
    }
    if (!('hashtag' in args) || typeof (args as any).hashtag !== 'string') {
        throw new Error('Invalid arguments: expected hashtag string');
    }
    if ('startTime' in args && typeof (args as any).startTime !== 'string') {
        throw new Error('Invalid arguments: expected startTime to be an ISO 8601 date string');
    }
    if ('endTime' in args && typeof (args as any).endTime !== 'string') {
        throw new Error('Invalid arguments: expected endTime to be an ISO 8601 date string');
    }
    if ('maxResults' in args) {
        const maxResults = (args as any).maxResults;
        if (typeof maxResults !== 'number' || maxResults < 10 || maxResults > 100) {
            throw new Error('Invalid arguments: maxResults must be a number between 10 and 100');
        }
    }
} 