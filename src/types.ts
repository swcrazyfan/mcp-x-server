export interface PostTweetArgs {
    text: string;
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

export function assertPostTweetArgs(args: unknown): asserts args is PostTweetArgs {
    if (typeof args !== 'object' || args === null) {
        throw new Error('Invalid arguments: expected object');
    }
    if (!('text' in args) || typeof (args as any).text !== 'string') {
        throw new Error('Invalid arguments: expected text string');
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