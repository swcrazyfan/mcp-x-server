export interface PostTweetArgs {
    text: string;
}

export interface SearchTweetsArgs {
    query: string;
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