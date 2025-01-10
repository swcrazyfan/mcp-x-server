# MCP Twitter Server

A Model Context Protocol (MCP) server that provides Twitter integration capabilities to Large Language Models.

## Features

- Post tweets
- Search tweets
- Reply to tweets (create threads)

## Installation

```bash
npm install mcp-twitter-server
```

## Configuration

Create a `.env` file with your Twitter API credentials:

```env
X_API_KEY=your_api_key
X_API_SECRET=your_api_secret
X_ACCESS_TOKEN=your_access_token
X_ACCESS_TOKEN_SECRET=your_access_token_secret
```

## Usage

### As a Command Line Tool

```bash
npx mcp-twitter-server
```

### As a Library

```typescript
import { startServer } from 'mcp-twitter-server';

startServer().catch(console.error);
```

## Available Tools

### postTweet

Posts a new tweet to Twitter.

```typescript
{
    text: string; // The text of the tweet
}
```

### searchTweets

Searches for tweets on Twitter.

```typescript
{
    query: string; // The search query
}
```

### replyToTweet

Replies to an existing tweet.

```typescript
{
    tweetId: string; // The ID of the tweet to reply to
    text: string;    // The text of the reply
}
```

## License

MIT 