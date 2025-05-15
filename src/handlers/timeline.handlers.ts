import { TwitterClient } from '../client/twitter.js';
import { HandlerResponse, TwitterHandler, GetHomeTimelineArgs } from '../types/handlers.js';
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
