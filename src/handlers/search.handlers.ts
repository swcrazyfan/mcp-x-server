import { TwitterClient as ApiV2Client } from '../client/twitter.js';
import { TwikitBridgeClient } from '../client/twikitBridgeClient.js';
import { HandlerResponse } from '../types/handlers.js';
import { createResponse } from '../utils/response.js';
import { TweetV2, TwitterApiReadOnly, UserV2, TweetSearchRecentV2Paginator } from 'twitter-api-v2';

interface SearchTweetsArgs {
    query: string;
    maxResults?: number;
    tweetFields?: string[];
}

interface HashtagAnalyticsArgs {
    hashtag: string;
    startTime?: string;
    endTime?: string;
}

interface TweetWithAuthor extends TweetV2 {
    author?: UserV2;
}

// Type guard to check client type
function isApiV2Client(client: ApiV2Client | TwikitBridgeClient): client is ApiV2Client {
    return client instanceof ApiV2Client;
}

export async function handleSearchTweets(
    client: ApiV2Client | TwikitBridgeClient,
    { query, maxResults = 10 }: { query: string; maxResults?: number }
): Promise<HandlerResponse> {
    try {
        if (isApiV2Client(client)) {
            const searchResults = await client.v2.search(query, {
                'max_results': maxResults,
                'tweet.fields': 'created_at,public_metrics,author_id',
                'expansions': 'author_id',
                'user.fields': 'username,name'
            });
            return createResponse(`Search results for "${query}": ${JSON.stringify(searchResults.data, null, 2)}`);
        } else {
            // Twikit search_tweet takes query, search_type ('Latest', 'Top', 'User', 'Image', 'Video'), count, cursor
            // Defaulting to 'Latest' search_type for now.
            const result = await client.searchTweet(query, 'Latest', maxResults);
            return createResponse(`Search results for "${query}" (via Twikit): ${JSON.stringify(result, null, 2)}`);
        }
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`Failed to search tweets for "${query}": ${error.message}`);
        }
        throw new Error('Failed to search tweets: Unknown error occurred');
    }
}

export async function handleHashtagAnalytics(
    client: ApiV2Client | TwikitBridgeClient,
    { hashtag, startTime, endTime }: { hashtag: string; startTime?: string; endTime?: string }
): Promise<HandlerResponse> {
    try {
        if (isApiV2Client(client)) {
            // Ensure hashtag doesn't start with # for the API call
            const cleanHashtag = hashtag.startsWith('#') ? hashtag.substring(1) : hashtag;
            const analytics = await client.v2.tweetCountRecent(cleanHashtag, { start_time: startTime, end_time: endTime });
            return createResponse(`Hashtag analytics for #${cleanHashtag}: ${JSON.stringify(analytics.data, null, 2)}\nTotal tweets: ${analytics.meta?.total_tweet_count}`);
        } else {
            // Twikit does not have a direct equivalent for recent tweet counts for a hashtag.
            // We could perform a search for the hashtag and count results, but it's not the same.
            // For now, indicating limited support for this specific function with Twikit.
            return createResponse(`Hashtag analytics for "${hashtag}" (via Twikit) is not directly supported. You can use general search. Searching for tweets with the hashtag...`);
            // Optionally, perform a search: const result = await client.searchTweet(hashtag, 'Latest', 20);
            // return createResponse(`Search for "${hashtag}" (via Twikit): ${JSON.stringify(result, null, 2)}`);
        }
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`Failed to get hashtag analytics for "${hashtag}": ${error.message}`);
        }
        throw new Error('Failed to get hashtag analytics: Unknown error occurred');
    }
} 