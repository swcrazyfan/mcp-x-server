# MCP X Server: Implementation Guide

This guide provides detailed instructions for implementing the missing features in the MCP X Server.

## Table of Contents

1. [Home Timeline Implementation](#home-timeline-implementation)
2. [Poll Support Implementation](#poll-support-implementation)
3. [Community Features Implementation](#community-features-implementation)
4. [Integration and Testing](#integration-and-testing)

## Home Timeline Implementation

### Step 1: Add Types

Create the necessary types in `src/types/handlers.ts`:

```typescript
export interface GetHomeTimelineArgs {
  maxResults?: number;
  excludeReplies?: boolean;
  excludeRetweets?: boolean;
  tweetFields?: string[];
  userFields?: string[];
  expansions?: TTweetv2Expansion[];
}
```

And in `src/types.ts`, add:

```typescript
export interface GetHomeTimelineArgs {
  maxResults?: number;
  excludeReplies?: boolean;
  excludeRetweets?: boolean;
  tweetFields?: string[];
  userFields?: string[];
}

export function assertGetHomeTimelineArgs(args: unknown): asserts args is GetHomeTimelineArgs {
  if (typeof args !== 'object' || args === null) {
    throw new Error('Invalid get home timeline arguments');
  }
  
  const { maxResults, excludeReplies, excludeRetweets, tweetFields, userFields } = args as any;
  
  if (maxResults !== undefined && (typeof maxResults !== 'number' || maxResults <= 0)) {
    throw new Error('maxResults must be a positive number');
  }
  
  if (excludeReplies !== undefined && typeof excludeReplies !== 'boolean') {
    throw new Error('excludeReplies must be a boolean');
  }
  
  if (excludeRetweets !== undefined && typeof excludeRetweets !== 'boolean') {
    throw new Error('excludeRetweets must be a boolean');
  }
  
  if (tweetFields !== undefined && (!Array.isArray(tweetFields) || 
      !tweetFields.every(field => typeof field === 'string'))) {
    throw new Error('tweetFields must be an array of strings');
  }
  
  if (userFields !== undefined && (!Array.isArray(userFields) || 
      !userFields.every(field => typeof field === 'string'))) {
    throw new Error('userFields must be an array of strings');
  }
}
```

### Step 2: Create the Handler

Create a new file `src/handlers/timeline.handlers.ts`:

```typescript
import { TwitterClient } from '../client/twitter.js';
import { HandlerResponse, TwitterHandler } from '../types/handlers.js';
import { createResponse } from '../utils/response.js';
import { TweetV2HomeTimelineParams, TweetV2PaginableTimelineParams } from 'twitter-api-v2';

export const handleGetHomeTimeline: TwitterHandler<GetHomeTimelineArgs> = async (
  client: TwitterClient,
  { 
    maxResults = 10, 
    excludeReplies = false, 
    excludeRetweets = false, 
    tweetFields = ['created_at', 'author_id', 'public_metrics', 'text'],
    userFields = ['id', 'name', 'username', 'profile_image_url'],
    expansions = ['author_id', 'referenced_tweets.id']
  }: GetHomeTimelineArgs
): Promise<HandlerResponse> => {
  try {
    // Parameters for the v2 API
    const params: TweetV2HomeTimelineParams = {
      max_results: maxResults,
      "tweet.fields": tweetFields.join(","),
      "user.fields": userFields.join(","),
      "expansions": expansions.join(","),
    };
    
    // Only set exclude if we have items to exclude
    const exclude: string[] = [];
    if (excludeReplies) exclude.push("replies");
    if (excludeRetweets) exclude.push("retweets");
    if (exclude.length > 0) {
      params.exclude = exclude as TweetV2PaginableTimelineParams["exclude"][];
    }
    
    // Get the results
    const timeline = await client.v2.homeTimeline(params);
    
    // Process and return the tweets
    const tweets = timeline.data.data || [];
    const users = timeline.data.includes?.users || [];
    
    // Format tweets with authors
    const formattedTweets = tweets.map(tweet => {
      const author = users.find(user => user.id === tweet.author_id);
      return {
        ...tweet,
        author: author ? {
          id: author.id,
          username: author.username,
          name: author.name,
          profile_image_url: author.profile_image_url
        } : undefined
      };
    });
    
    return createResponse(
      `Retrieved ${tweets.length} tweets from your home timeline`, 
      { tweets: formattedTweets }
    );
  } catch (error) {
    console.error('Error fetching home timeline:', error);
    throw error;
  }
};
```

### Step 3: Update Index.ts

In `src/index.ts`, import and register the new handler:

```typescript
// Add to imports
import { handleGetHomeTimeline } from './handlers/timeline.handlers.js';

// Add to the tool registrations
{
  name: 'get_home_timeline',
  description: 'Get tweets from your home timeline',
  parameters: {
    maxResults: { type: 'number', description: 'Maximum number of tweets to retrieve' },
    excludeReplies: { type: 'boolean', description: 'Exclude replies from the results' },
    excludeRetweets: { type: 'boolean', description: 'Exclude retweets from the results' },
    tweetFields: { type: 'array', items: { type: 'string' }, description: 'Additional tweet fields to include' },
    userFields: { type: 'array', items: { type: 'string' }, description: 'Additional user fields to include' }
  },
  handler: async (args) => {
    assertGetHomeTimelineArgs(args);
    return handleGetHomeTimeline(client, args);
  }
}
```

## Poll Support Implementation

### Step 1: Add Types

In `src/types/handlers.ts`, add:

```typescript
export interface PollOption {
  label: string;
}

export interface PollOptions {
  options: PollOption[];
  duration_minutes?: number;
}

export interface PostTweetWithPollArgs extends TweetHandlerArgs {
  poll: PollOptions;
}
```

In `src/types.ts`, add:

```typescript
export interface PollOption {
  label: string;
}

export interface PollOptions {
  options: PollOption[];
  duration_minutes?: number;
}

export interface PostTweetWithPollArgs extends PostTweetArgs {
  poll: PollOptions;
}

export function assertPostTweetWithPollArgs(args: unknown): asserts args is PostTweetWithPollArgs {
  assertPostTweetArgs(args);
  
  const { poll } = args as any;
  
  if (!poll || typeof poll !== 'object') {
    throw new Error('Poll options are required');
  }
  
  const { options, duration_minutes } = poll;
  
  if (!Array.isArray(options) || options.length < 2 || options.length > 4) {
    throw new Error('Poll must have between 2 and 4 options');
  }
  
  if (!options.every(opt => typeof opt === 'object' && typeof opt.label === 'string' && opt.label.trim() !== '')) {
    throw new Error('Each poll option must have a non-empty label');
  }
  
  if (duration_minutes !== undefined && (typeof duration_minutes !== 'number' || duration_minutes <= 0)) {
    throw new Error('Poll duration must be a positive number of minutes');
  }
}
```

### Step 2: Create/Update the Handler

In `src/handlers/tweet.handlers.ts`, add:

```typescript
export async function handlePostTweetWithPoll(
  client: TwitterClient,
  { text, poll }: PostTweetWithPollArgs
): Promise<HandlerResponse> {
  try {
    // Build the tweet parameters
    const params: SendTweetV2Params = {
      text: text
    };
    
    // Add poll
    params.poll = {
      options: poll.options.map(opt => opt.label),
      duration_minutes: poll.duration_minutes || 1440 // Default to 24 hours
    };
    
    // Post the tweet
    const result = await client.v2.tweet(params);
    
    return createResponse(
      `Tweet with poll posted successfully: https://twitter.com/i/status/${result.data.id}`,
      { tweet_id: result.data.id }
    );
  } catch (error) {
    console.error('Error posting tweet with poll:', error);
    throw error;
  }
}
```

### Step 3: Update Index.ts

In `src/index.ts`, register the new tool:

```typescript
{
  name: 'post_tweet_with_poll',
  description: 'Post a new tweet with a poll',
  parameters: {
    text: { type: 'string', description: 'The text content of the tweet' },
    poll: {
      type: 'object',
      properties: {
        options: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              label: { type: 'string', description: 'Poll option text' }
            },
            required: ['label']
          },
          description: 'Poll options (2-4 options required)'
        },
        duration_minutes: { type: 'number', description: 'Poll duration in minutes (default: 1440 - 24 hours)' }
      },
      required: ['options']
    }
  },
  handler: async (args) => {
    assertPostTweetWithPollArgs(args);
    return handlePostTweetWithPoll(client, args);
  }
}
```

## Community Features Implementation

### Step 1: Add Types

In `src/types/handlers.ts`, add:

```typescript
export interface SearchCommunitiesArgs {
  query: string;
  maxResults?: number;
}

export interface GetCommunityArgs {
  communityId: string;
}

export interface JoinCommunityArgs {
  communityId: string;
}

export interface LeaveCommunityArgs {
  communityId: string;
}

export interface PostToCommunityArgs {
  communityId: string;
  text: string;
}

export interface GetCommunityTweetsArgs {
  communityId: string;
  maxResults?: number;
}
```

In `src/types.ts`, add corresponding types and assertion functions:

```typescript
export interface SearchCommunitiesArgs {
  query: string;
  maxResults?: number;
}

export function assertSearchCommunitiesArgs(args: unknown): asserts args is SearchCommunitiesArgs {
  if (typeof args !== 'object' || args === null) {
    throw new Error('Invalid search communities arguments');
  }
  
  const { query, maxResults } = args as any;
  
  if (typeof query !== 'string' || query.trim() === '') {
    throw new Error('Query is required and must be a non-empty string');
  }
  
  if (maxResults !== undefined && (typeof maxResults !== 'number' || maxResults <= 0)) {
    throw new Error('maxResults must be a positive number');
  }
}

// Add similar assertion functions for other community types
```

### Step 2: Create Community Handlers

Create a new file `src/handlers/community.handlers.ts`:

```typescript
import { TwitterClient } from '../client/twitter.js';
import { HandlerResponse, TwitterHandler } from '../types/handlers.js';
import { createResponse } from '../utils/response.js';
import { CommunitySearchV2Params } from 'twitter-api-v2';

export const handleSearchCommunities: TwitterHandler<SearchCommunitiesArgs> = async (
  client: TwitterClient,
  { query, maxResults = 10 }: SearchCommunitiesArgs
): Promise<HandlerResponse> => {
  try {
    const params: CommunitySearchV2Params = {
      query,
      max_results: Math.min(maxResults, 20) // API limit
    };
    
    const result = await client.v2.searchCommunities(params);
    
    return createResponse(
      `Found ${result.data.length} communities matching "${query}"`,
      { communities: result.data }
    );
  } catch (error) {
    console.error('Error searching communities:', error);
    throw error;
  }
};

export const handleGetCommunity: TwitterHandler<GetCommunityArgs> = async (
  client: TwitterClient,
  { communityId }: GetCommunityArgs
): Promise<HandlerResponse> => {
  try {
    const community = await client.v2.community(communityId);
    
    return createResponse(
      `Retrieved community: ${community.data.name}`,
      { community: community.data }
    );
  } catch (error) {
    console.error('Error getting community:', error);
    throw error;
  }
};

export const handleJoinCommunity: TwitterHandler<JoinCommunityArgs> = async (
  client: TwitterClient,
  { communityId }: JoinCommunityArgs
): Promise<HandlerResponse> => {
  try {
    await client.v2.joinCommunity(communityId);
    
    return createResponse(`Successfully joined the community`);
  } catch (error) {
    console.error('Error joining community:', error);
    throw error;
  }
};

export const handleLeaveCommunity: TwitterHandler<LeaveCommunityArgs> = async (
  client: TwitterClient,
  { communityId }: LeaveCommunityArgs
): Promise<HandlerResponse> => {
  try {
    await client.v2.leaveCommunity(communityId);
    
    return createResponse(`Successfully left the community`);
  } catch (error) {
    console.error('Error leaving community:', error);
    throw error;
  }
};

export const handlePostToCommunity: TwitterHandler<PostToCommunityArgs> = async (
  client: TwitterClient,
  { communityId, text }: PostToCommunityArgs
): Promise<HandlerResponse> => {
  try {
    const result = await client.v2.tweetToCommunity(communityId, text);
    
    return createResponse(
      `Posted to community: https://twitter.com/i/status/${result.data.id}`,
      { tweet_id: result.data.id }
    );
  } catch (error) {
    console.error('Error posting to community:', error);
    throw error;
  }
};

export const handleGetCommunityTweets: TwitterHandler<GetCommunityTweetsArgs> = async (
  client: TwitterClient,
  { communityId, maxResults = 10 }: GetCommunityTweetsArgs
): Promise<HandlerResponse> => {
  try {
    const result = await client.v2.communityTweets(communityId, {
      max_results: maxResults
    });
    
    return createResponse(
      `Retrieved ${result.data.data.length} tweets from the community`,
      { tweets: result.data.data }
    );
  } catch (error) {
    console.error('Error getting community tweets:', error);
    throw error;
  }
};
```

### Step 3: Update Index.ts

In `src/index.ts`, import and register the new handlers:

```typescript
// Add to imports
import {
  handleSearchCommunities,
  handleGetCommunity,
  handleJoinCommunity,
  handleLeaveCommunity,
  handlePostToCommunity,
  handleGetCommunityTweets
} from './handlers/community.handlers.js';

// Add tools registrations for each community handler
{
  name: 'search_communities',
  description: 'Search for Twitter communities by keyword',
  parameters: {
    query: { type: 'string', description: 'Search term to find communities' },
    maxResults: { type: 'number', description: 'Maximum number of communities to return' }
  },
  handler: async (args) => {
    assertSearchCommunitiesArgs(args);
    return handleSearchCommunities(client, args);
  }
}
// Add similar registrations for other community handlers
```

## Integration and Testing

### Integration Steps

1. Add all the new types to `src/types.ts` and `src/types/handlers.ts`
2. Create `src/handlers/timeline.handlers.ts` for home timeline
3. Update `src/handlers/tweet.handlers.ts` for poll support
4. Create `src/handlers/community.handlers.ts` for community features
5. Update `src/index.ts` to register all new tools
6. Update any documentation in README.md

### Testing Plan

Test each new feature separately:

1. **Home Timeline Testing**:
   - Fetch home timeline with default parameters
   - Test with different max results values
   - Test with excludeReplies = true
   - Test with excludeRetweets = true
   - Test with custom fields

2. **Poll Support Testing**:
   - Create a tweet with 2 poll options
   - Create a tweet with 4 poll options
   - Try creating a poll with custom duration
   - Test error handling with invalid options

3. **Community Features Testing**:
   - Search for communities
   - Get community details
   - Join/leave a community
   - Post to a community
   - Get tweets from a community

### Common Issues and Solutions

1. **Rate Limiting**: If hitting rate limits, implement caching or rate limit handling as in the original implementation.

2. **API Changes**: The Twitter API may change; check for updates to the twitter-api-v2 library.

3. **Permission Issues**: Ensure the Twitter API tokens have the correct permissions for all operations.

4. **Error Handling**: Enhance error handling for specific API errors that might occur with these endpoints.
