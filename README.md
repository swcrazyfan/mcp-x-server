# Twitter MCP Server

A Model Context Protocol (MCP) server that allows Large Language Models (LLMs) to interact with Twitter (X). This server provides tools for posting tweets, searching tweets, and replying to tweets.

## Features

- **Post Tweets:** Allows LLMs to post new tweets to your Twitter account
- **Search Tweets:** Allows LLMs to search for tweets based on keywords
- **Reply to Tweets:** Allows LLMs to reply to existing tweets, which can be used to make threads

## Prerequisites

Before you begin, ensure you have met the following requirements:

- **Node.js** (version 18 or higher) installed. You can download it from [nodejs.org](https://nodejs.org/)
- **npm** (comes with Node.js)
- A **Twitter Developer Account** and API keys (see [Twitter Developer Portal](https://developer.twitter.com/en/portal/dashboard)). You will need API Key, API Secret Key, Access Token, Access Token Secret
- **Claude for Desktop** installed. You can download it from [claude.ai/download](https://claude.ai/download)

## Installation

1. **Install the package:**
   ```bash
   npm install mcp-twitter-server
   ```

2. **Set up environment variables:**
   - Create a `.env` file in your project root
   - Add your Twitter API keys and access tokens:
   ```env
   # Twitter API Credentials
   X_API_KEY=your_api_key
   X_API_SECRET=your_api_secret
   X_ACCESS_TOKEN=your_access_token
   X_ACCESS_TOKEN_SECRET=your_access_token_secret
   ```

## Using with Claude Desktop

To connect this Twitter MCP server to Claude Desktop:

1. **Open Claude Desktop Settings:**
   - Open the Claude Desktop application
   - Click the Claude menu from the top of your screen
   - Select "Settings..."

2. **Open Developer Settings:**
   - Select the "Developer" tab in the left panel
   - Click "Edit Config." This should open a `claude_desktop_config.json` file in your text editor

3. **Add the Server Configuration:**
   Add the following configuration to your `claude_desktop_config.json`:

   ```json
   {
     "mcpServers": {
       "twitter": {
         "command": "node",
         "args": [
           "/ABSOLUTE/PATH/TO/node_modules/mcp-twitter-server/dist/index.js"
         ],
         "env": {
           "X_API_KEY": "YOUR_TWITTER_API_KEY",
           "X_API_SECRET": "YOUR_TWITTER_API_SECRET",
           "X_ACCESS_TOKEN": "YOUR_TWITTER_ACCESS_TOKEN",
           "X_ACCESS_TOKEN_SECRET": "YOUR_TWITTER_ACCESS_TOKEN_SECRET"
         }
       }
     }
   }
   ```

   Replace the placeholders:
   - Update the path to match your project's `node_modules` location
   - Add your actual Twitter API credentials
   - **macOS path example:** `/Users/yourusername/project/node_modules/mcp-twitter-server/dist/index.js`
   - **Windows path example:** `C:\\Users\\yourusername\\project\\node_modules\\mcp-twitter-server\\dist\\index.js`

4. **Save and Restart:**
   - Save the `claude_desktop_config.json` file
   - Restart Claude Desktop

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

## Using the Tools

Once connected, you can use the tools by prompting Claude. For example:

1. **Post a tweet:**
   ```
   Post a tweet saying "Hello, world!"
   ```

2. **Search for tweets:**
   ```
   Search for tweets about "artificial intelligence"
   ```

3. **Reply to a tweet:**
   ```
   Search for tweets about "test"
   ```
   Then use the tweet ID from the results:
   ```
   Reply to tweet with id <TWEET_ID> saying "This is a reply"
   ```

## Development

To run the server directly:

1. Clone the repository:
   ```bash
   git clone https://github.com/crazyrabbitLTC/mcp-twitter-server.git
   cd mcp-twitter-server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build and run:
   ```bash
   npm run build
   npm start
   ```

## Contributing

Contributions are welcome! Please feel free to submit pull requests or create issues to suggest improvements.

## License

This project is licensed under the MIT License.
```
