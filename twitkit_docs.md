Here's a **Markdown** conversion of your docs for the `twikit` Python package (with headings, code blocks, and lists for better readability):

---

# twikit

> **Twikit**: Twitter API Wrapper  
> [GitHub](https://github.com/d60/twikit)  
> A Python library for interacting with the Twitter API.

## Contents

- twikit package
- Client
- Tweet
- User
- Message
- Streaming
- Media
- Trend
- List
- Community
- Notification
- Geo
- Capsolver
- Utils
- Errors

---

# twikit package

## Twikit Twitter API Wrapper

> [twikit GitHub](https://github.com/d60/twikit)  
A Python asynchronous library for interacting with Twitter programmatically.

---

## Client

```python
from twikit.client.client import Client

client = Client(language='en-US')
await client.login(
    auth_info_1='example_user',
    auth_info_2='email@example.com',
    password='00000000'
)
```

- **language** (`str`, optional): Language code for requests.
- **proxy** (`str`, optional): Proxy URL, e.g. `'http://0.0.0.0:0000'`
- **captcha_solver** (`Capsolver`, optional): CAPTCHA solver instance.

See [Capsolver](#capsolver) for details.

### Login

```python
await client.login(
    auth_info_1='example_user',
    auth_info_2='email@example.com',
    password='00000000'
)
```

- `auth_info_1` (`str`, required): Username/email/phone.
- `auth_info_2` (`str`, optional): Additional identifier.
- `password` (`str`, required): Account password.
- `totp_secret` (`str`, optional): For 2FA.
- `cookies_file` (`str`, optional): Store/load login cookies.
- `enable_ui_metrics` (`bool`, default=`True`): Run JS obfuscated metrics for safety.

### Logout

```python
await client.logout()
```

### Unlock (CAPTCHA)

```python
await client.unlock()
```

---

### Cookies Management

- `get_cookies() -> dict`
- `save_cookies(path: str)`
- `set_cookies(cookies: dict, clear_cookies: bool = False)`
- `load_cookies(path: str)`

Examples:
```python
client.get_cookies()
client.save_cookies('cookies.json')
with open('cookies.json', 'r') as f:
    client.set_cookies(json.load(f))
client.load_cookies('cookies.json')
```

---

### Delegated Account

- `set_delegate_account(user_id: str | None)`: Act as another account

### Authenticated User Info

- `await client.user_id() -> str`
- `await client.user() -> User`

---

## Searching & Fetching Data

### Search Tweets

```python
tweets = await client.search_tweet('query', 'Top')
for tweet in tweets:
   print(tweet)
more_tweets = await tweets.next()
```

- `query`: Search query string.
- `product`: `'Top' | 'Latest' | 'Media'`
- `count`: Number [1, 20]
- `cursor`: Pagination token

### Search Users

Similarly, for users:
```python
result = await client.search_user('query')
for user in result:
    print(user)
more_results = await result.next()
```

### Get Highlighted Tweets

```python
result = await client.get_user_highlights_tweets('123456789')
for tweet in result:
    print(tweet)
more_results = await result.next()
```

---

## Media Upload

```python
media_id = await client.upload_media('media.jpg')
await client.create_media_metadata(
    media_id,
    alt_text='This is a sample media',
    sensitive_warning=['other']
)
```

- Supports videos, gifs, and images.

Other functions:
- `check_media_status(media_id)`
- `create_media_metadata(media_id, alt_text, sensitive_warning)`

---

## Polls

```python
poll_uri = await client.create_poll(['A', 'B', 'C'], 60)
await client.create_tweet(poll_uri=poll_uri)
```

Vote:
```python
await client.vote('Option A', poll_uri, tweet_id, card_name)
```

---

## Tweets (Create, Edit, Schedule, Delete)

- `create_tweet(text, media_ids, poll_uri, ...)`
- `create_scheduled_tweet(scheduled_at, text, media_ids)`
- `delete_tweet(tweet_id)`
- `edit_tweet_id` (for editing, premium only)

---

## Get Tweets/Users

- `get_user_by_screen_name(screen_name)`
- `get_user_by_id(user_id)`

---

## Timelines

- `get_timeline()` (For You)
- `get_latest_timeline()` (Following)

---

## Favorites, Retweets, Bookmarks

- `favorite_tweet(tweet_id)`
- `unfavorite_tweet(tweet_id)`
- `retweet(tweet_id)`
- `delete_retweet(tweet_id)`
- `bookmark_tweet(tweet_id, folder_id=None)`
- `delete_bookmark(tweet_id)`
- `get_bookmarks(count, cursor, folder_id)`
- `delete_all_bookmarks()`
- `get_bookmark_folders(cursor)`
- `edit_bookmark_folder(folder_id, name)`
- `delete_bookmark_folder(folder_id)`
- `create_bookmark_folder(name)`

---

## Follows, Blocks, Mutes

- `follow_user(user_id)`
- `unfollow_user(user_id)`
- `block_user(user_id)`
- `unblock_user(user_id)`
- `mute_user(user_id)`
- `unmute_user(user_id)`

---

## Trends & Locations

- `get_trends(category, count, retry, additional_request_params)`
- `get_available_locations()`
- `get_place_trends(woeid)`

---

## Followers, Following

- `get_user_followers(user_id, count, cursor)`
- `get_latest_followers(user_id, screen_name, count, cursor)`
- `get_latest_friends(user_id, screen_name, count, cursor)`
- `get_user_verified_followers(user_id, count, cursor)`
- `get_user_followers_you_know(user_id, count, cursor)`
- `get_user_following(user_id, count, cursor)`
- `get_user_subscriptions(user_id, count, cursor)`
- `get_followers_ids(user_id, screen_name, count, cursor)`
- `get_friends_ids(user_id, screen_name, count, cursor)`

---

## Direct Messages

- `send_dm(user_id, text, media_id, reply_to)`
- `add_reaction_to_message(message_id, conversation_id, emoji)`
- `remove_reaction_from_message(message_id, conversation_id, emoji)`
- `delete_dm(message_id)`
- `get_dm_history(user_id, max_id)`
- `send_dm_to_group(group_id, text, media_id, reply_to)`
- `get_group_dm_history(group_id, max_id)`
- `get_group(group_id)`
- `add_members_to_group(group_id, user_ids)`
- `change_group_name(group_id, name)`

---

## Lists

- `create_list(name, description, is_private)`
- `edit_list_banner(list_id, media_id)`
- `delete_list_banner(list_id)`
- `edit_list(list_id, name, description, is_private)`
- `add_list_member(list_id, user_id)`
- `remove_list_member(list_id, user_id)`
- `get_lists(count, cursor)`
- `get_list(list_id)`
- `get_list_tweets(list_id, count, cursor)`
- `get_list_members(list_id, count, cursor)`
- `get_list_subscribers(list_id, count, cursor)`
- `search_list(query, count, cursor)`

---

## Notifications

- `get_notifications(type: 'All' | 'Verified' | 'Mentions', count, cursor)`

---

## Communities

- `search_community(query, cursor)`
- `get_community(community_id)`
- `get_community_tweets(community_id, tweet_type, count, cursor)`
- `get_communities_timeline(count, cursor)`
- `join_community(community_id)`
- `leave_community(community_id)`
- `request_to_join_community(community_id, answer)`
- `get_community_members(community_id, count, cursor)`
- `get_community_moderators(community_id, count, cursor)`
- `search_community_tweet(community_id, query, count, cursor)`

---

## Streaming

Receive real-time events (tweet engagements, DM updates...).

```python
from twikit.streaming import Topic

topics = {
    Topic.tweet_engagement('1739617652'),
    Topic.dm_update('17544932482-174455537996'),
    Topic.dm_typing('17544932482-174455537996')
}
session = await client.get_streaming_session(topics)
async for topic, payload in session:
    if payload.dm_update:
        # handle DM update
    if payload.dm_typing:
        # handle typing event
    if payload.tweet_engagement:
        # handle tweet engagement
```

You can update streaming topics with:
```python
await session.update_subscriptions(subscribe_topics, unsubscribe_topics)
```

---

## Tweets (`twikit.tweet.Tweet`)

Properties include:

- `id` (str)
- `created_at` (str)
- `user` (User)
- `text` (str)
- `lang` (str)
- `in_reply_to` (str)
- `quote`, `retweeted_tweet` (Tweet)
- `reply_count`, `favorite_count`, `view_count`, `retweet_count`, etc.
- `media` (`list[Photo | AnimatedGif | Video]`)
- ... and others

Common methods:

- `delete()`
- `favorite() / unfavorite()`
- `retweet() / delete_retweet()`
- `bookmark() / delete_bookmark()`
- `reply(text, media_ids)`
- `get_retweeters(count, cursor)`
- `get_favoriters(count, cursor)`
- `get_similar_tweets()`

---

## Polls (`twikit.tweet.Poll`)

Properties:

- `id`, `name`, `choices`, `duration_minutes`, etc.
- `vote(selected_choice)` to vote on a poll.

---

## Community Note (`twikit.tweet.CommunityNote`)

Properties:

- `id`, `text`, `misleading_tags`, `trustworthy_sources`, etc.

---

## User (`twikit.user.User`)

Properties include:

- `id`, `created_at`, `name`, `screen_name`
- `profile_image_url`, `profile_banner_url`
- `url`, `location`, `description`
- `followers_count`, `following_count`, `favourites_count`, `statuses_count`
- and many booleans for profile flags

Common methods (all async):

- `get_tweets(tweet_type, count)`
- `follow()`, `unfollow()`
- `block()`, `unblock()`
- `mute()`, `unmute()`
- `get_followers(count)`
- `get_verified_followers(count)`
- `get_followers_you_know(count)`
- `get_following(count)`
- `get_subscriptions(count)`
- `send_dm(text, media_id, reply_to)`
- `get_dm_history(max_id)`
- `get_highlights_tweets(count, cursor)`

---

## Message (`twikit.message.Message`)

Properties:

- `id`, `time`, `text`, `attachment`

Methods:

- `reply(text, media_id)`
- `add_reaction(emoji)`, `remove_reaction(emoji)`
- `delete()`

---

## Streaming

- `StreamingSession`: loop yields `(topic, payload)`
- `session.update_subscriptions(subscribe, unsubscribe)`

Utility: `Topic.tweet_engagement(tweet_id)`, `Topic.dm_update(conversation_id)`, `Topic.dm_typing(conversation_id)`

---

## Media

Types: `Media`, `Photo`, `Video`, `AnimatedGif`, `Stream`

Properties include:

- `id`, `display_url`, `media_url`, `type`, `sizes`, `streams`, etc.

Video Example:
```python
tweet = await client.get_tweet_by_id('...')
video = tweet.media[0]
streams = video.streams
await streams[0].download('output.mp4')
```

---

## Trends

- `Trend`: Has `name`, `tweets_count`, etc.
- `PlaceTrend`, `Location`, etc.

---

## List (`twikit.list.List`)

- `id`, `created_at`, `description`, `name`, `is_member`, etc.
- `edit_banner(media_id)`
- `edit(name, description, is_private)`
- `add_member(user_id)`, `remove_member(user_id)`
- `get_tweets(count, cursor)`
- `get_members(count, cursor)`
- `get_subscribers(count, cursor)`

---

## Community

- `Community`
- `CommunityMember`
- `CommunityRule`

Properties:
- `id`, `name`, `member_count`, `is_nsfw`, `description`, `creator`, `admin`, etc.

Methods:
- Normal `get_tweets`, `join`, `leave`, `request_to_join`, `get_members`, `get_moderators`, `search_tweet`, `update`

---

## Notification

- `Notification` with properties: `id`, `timestamp_ms`, `icon`, `message`, `tweet`, `from_user`

---

## Geo

- `Place`: `id`, `name`, `full_name`, `country`, `country_code`, `url`, etc.

---

## Capsolver

> Unlock accounts automatically by passing a [Capsolver](https://capsolver.com) API key.

```python
from twikit.twikit_async import Capsolver, Client
solver = Capsolver(api_key='your_api_key', max_attempts=10)
client = Client(captcha_solver=solver)
```
- `api_key`, `max_attempts`, `get_result_interval`, `use_blob_data`

---

## Utils

### `Result`

Iterable result class for anything that returns multiple items (users, tweets, etc.).

- `next()`, `previous()`
- `token`, `cursor`, etc.

---

## Errors

All errors inherit from `twikit.errors.TwitterException`

- `BadRequest`
- `Unauthorized`
- `Forbidden`
- `NotFound`
- `RequestTimeout`
- `TooManyRequests`
- `ServerError`
- `CouldNotTweet`
- `DuplicateTweet`
- `TweetNotAvailable`
- `InvalidMedia`
- `UserNotFound`
- `UserUnavailable`
- `AccountSuspended`
- `AccountLocked`

---

© Copyright 2024, twikit.  
Built with Sphinx using a theme provided by Read the Docs.

---

*For more info and API details, visit:*  
https://github.com/d60/twikit

---

If you need richer formatting (tables, collapsible sections), let me know which parts to detail or expand!# twikit

> **Twikit**: Twitter API Wrapper
> [GitHub](https://github.com/d60/twikit)
> A Python library for interacting with the Twitter API.

## Contents

- twikit package
- Client
- Tweet
- User
- Message
- Streaming
- Media
- Trend
- List
- Community
- Notification
- Geo
- Capsolver
- Utils
- Errors

---

# twikit package

## Twikit Twitter API Wrapper

> [twikit GitHub](https://github.com/d60/twikit)
A Python asynchronous library for interacting with Twitter programmatically.

---

## Client

```python
from twikit.client.client import Client

client = Client(language='en-US')
await client.login(
    auth_info_1='example_user',
    auth_info_2='email@example.com',
    password='00000000'
)
language (str, optional): Language code for requests.proxy (str, optional): Proxy URL, e.g. 'http://0.0.0.0:0000'captcha_solver (Capsolver, optional): CAPTCHA solver instance.See Capsolver for details.Loginawait client.login(
    auth_info_1='example_user',
    auth_info_2='email@example.com',
    password='00000000'
)
auth_info_1 (str, required): Username/email/phone.auth_info_2 (str, optional): Additional identifier.password (str, required): Account password.totp_secret (str, optional): For 2FA.cookies_file (str, optional): Store/load login cookies.enable_ui_metrics (bool, default=True): Run JS obfuscated metrics for safety.Logoutawait client.logout()
Unlock (CAPTCHA)await client.unlock()
Cookies Managementget_cookies() -> dictsave_cookies(path: str)set_cookies(cookies: dict, clear_cookies: bool = False)load_cookies(path: str)Examples:client.get_cookies()
client.save_cookies('cookies.json')
with open('cookies.json', 'r') as f:
    client.set_cookies(json.load(f))
client.load_cookies('cookies.json')
Delegated Accountset_delegate_account(user_id: str | None): Act as another accountAuthenticated User Infoawait client.user_id() -> strawait client.user() -> UserSearching & Fetching DataSearch Tweetstweets = await client.search_tweet('query', 'Top')
for tweet in tweets:
    print(tweet)
more_tweets = await tweets.next()
query: Search query string.product: 'Top' | 'Latest' | 'Media'count: Number [1, 20]cursor: Pagination tokenSearch UsersSimilarly, for users:result = await client.search_user('query')
for user in result:
    print(user)
more_results = await result.next()
Get Highlighted Tweetsresult = await client.get_user_highlights_tweets('123456789')
for tweet in result:
    print(tweet)
more_results = await result.next()
Media Uploadmedia_id = await client.upload_media('media.jpg')
await client.create_media_metadata(
    media_id,
    alt_text='This is a sample media',
    sensitive_warning=['other']
)
Supports videos, gifs, and images.Other functions:check_media_status(media_id)create_media_metadata(media_id, alt_text, sensitive_warning)Pollspoll_uri = await client.create_poll(['A', 'B', 'C'], 60)
await client.create_tweet(poll_uri=poll_uri)
Vote:await client.vote('Option A', poll_uri, tweet_id, card_name)
Tweets (Create, Edit, Schedule, Delete)create_tweet(text, media_ids, poll_uri, ...)create_scheduled_tweet(scheduled_at, text, media_ids)delete_tweet(tweet_id)edit_tweet_id (for editing, premium only)Get Tweets/Usersget_user_by_screen_name(screen_name)get_user_by_id(user_id)Timelinesget_timeline() (For You)get_latest_timeline() (Following)Favorites, Retweets, Bookmarksfavorite_tweet(tweet_id)unfavorite_tweet(tweet_id)retweet(tweet_id)delete_retweet(tweet_id)bookmark_tweet(tweet_id, folder_id=None)delete_bookmark(tweet_id)get_bookmarks(count, cursor, folder_id)delete_all_bookmarks()get_bookmark_folders(cursor)edit_bookmark_folder(folder_id, name)delete_bookmark_folder(folder_id)create_bookmark_folder(name)Follows, Blocks, Mutesfollow_user(user_id)unfollow_user(user_id)block_user(user_id)unblock_user(user_id)mute_user(user_id)unmute_user(user_id)Trends & Locationsget_trends(category, count, retry, additional_request_params)get_available_locations()get_place_trends(woeid)Followers, Followingget_user_followers(user_id, count, cursor)get_latest_followers(user_id, screen_name, count, cursor)get_latest_friends(user_id, screen_name, count, cursor)get_user_verified_followers(user_id, count, cursor)get_user_followers_you_know(user_id, count, cursor)get_user_following(user_id, count, cursor)get_user_subscriptions(user_id, count, cursor)get_followers_ids(user_id, screen_name, count, cursor)get_friends_ids(user_id, screen_name, count, cursor)Direct Messagessend_dm(user_id, text, media_id, reply_to)add_reaction_to_message(message_id, conversation_id, emoji)remove_reaction_from_message(message_id, conversation_id, emoji)delete_dm(message_id)get_dm_history(user_id, max_id)send_dm_to_group(group_id, text, media_id, reply_to)get_group_dm_history(group_id, max_id)get_group(group_id)add_members_to_group(group_id, user_ids)change_group_name(group_id, name)Listscreate_list(name, description, is_private)edit_list_banner(list_id, media_id)delete_list_banner(list_id)edit_list(list_id, name, description, is_private)add_list_member(list_id, user_id)remove_list_member(list_id, user_id)get_lists(count, cursor)get_list(list_id)get_list_tweets(list_id, count, cursor)get_list_members(list_id, count, cursor)get_list_subscribers(list_id, count, cursor)search_list(query, count, cursor)Notificationsget_notifications(type: 'All' | 'Verified' | 'Mentions', count, cursor)Communitiessearch_community(query, cursor)get_community(community_id)get_community_tweets(community_id, tweet_type, count, cursor)get_communities_timeline(count, cursor)join_community(community_id)leave_community(community_id)request_to_join_community(community_id, answer)get_community_members(community_id, count, cursor)get_community_moderators(community_id, count, cursor)search_community_tweet(community_id, query, count, cursor)StreamingReceive real-time events (tweet engagements, DM updates...).from twikit.streaming import Topic

topics = {
    Topic.tweet_engagement('1739617652'),
    Topic.dm_update('17544932482-174455537996'),
    Topic.dm_typing('17544932482-174455537996')
}
session = await client.get_streaming_session(topics)
async for topic, payload in session:
    if payload.dm_update:
        # handle DM update
        pass
    if payload.dm_typing:
        # handle typing event
        pass
    if payload.tweet_engagement:
        # handle tweet engagement
        pass
You can update streaming topics with:await session.update_subscriptions(subscribe_topics, unsubscribe_topics)
Tweets (twikit.tweet.Tweet)Properties include:id (str)created_at (str)user (User)text (str)lang (str)in_reply_to (str)quote, retweeted_tweet (Tweet)reply_count, favorite_count, view_count, retweet_count, etc.media (list[Photo | AnimatedGif | Video])... and othersCommon methods:delete()favorite() / unfavorite()retweet() / delete_retweet()bookmark() / delete_bookmark()reply(text, media_ids)get_retweeters(count, cursor)get_favoriters(count, cursor)get_similar_tweets()Polls (twikit.tweet.Poll)Properties:id, name, choices, duration_minutes, etc.vote(selected_choice) to vote on a poll.Community Note (twikit.tweet.CommunityNote)Properties:id, text, misleading_tags, trustworthy_sources, etc.User (twikit.user.User)Properties include:id, created_at, name, screen_nameprofile_image_url, profile_banner_urlurl, location, descriptionfollowers_count, following_count, favourites_count, statuses_countand many booleans for profile flagsCommon methods (all async):get_tweets(tweet_type, count)follow(), unfollow()block(), unblock()mute(), unmute()get_followers(count)get_verified_followers(count)get_followers_you_know(count)get_following(count)get_subscriptions(count)send_dm(text, media_id, reply_to)get_dm_history(max_id)get_highlights_tweets(count, cursor)Message (twikit.message.Message)Properties:id, time, text, attachmentMethods:reply(text, media_id)add_reaction(emoji), remove_reaction(emoji)delete()StreamingStreamingSession: loop yields (topic, payload)session.update_subscriptions(subscribe, unsubscribe)Utility: Topic.tweet_engagement(tweet_id), Topic.dm_update(conversation_id), Topic.dm_typing(conversation_id)MediaTypes: Media, Photo, Video, AnimatedGif, StreamProperties include:id, display_url, media_url, type, sizes, streams, etc.Video Example:tweet = await client.get_tweet_by_id('...')
video = tweet.media[0]
streams = video.streams
await streams[0].download('output.mp4')
TrendsTrend: Has name, tweets_count, etc.PlaceTrend, Location, etc.List (twikit.list.List)id, created_at, description, name, is_member, etc.edit_banner(media_id)edit(name, description, is_private)add_member(user_id), remove_member(user_id)get_tweets(count, cursor)get_members(count, cursor)get_subscribers(count, cursor)CommunityCommunityCommunityMemberCommunityRuleProperties:id, name, member_count, is_nsfw, description, creator, admin, etc.Methods:Normal get_tweets, join, leave, request_to_join, get_members, get_moderators, search_tweet, updateNotificationNotification with properties: id, timestamp_ms, icon, message, tweet, from_userGeoPlace: id, name, full_name, country, country_code, url, etc.CapsolverUnlock accounts automatically by passing a Capsolver API key.from twikit.twikit_async import Capsolver, Client
solver = Capsolver(api_key='your_api_key', max_attempts=10)
client = Client(captcha_solver=solver)
api_key, max_attempts, get_result_interval, use_blob_dataUtilsResultIterable result class for anything that returns multiple items (users, tweets, etc.).next(), previous()token, cursor, etc.ErrorsAll errors inherit from twikit.errors.TwitterExceptionBadRequestUnauthorizedForbiddenNotFoundRequestTimeoutTooManyRequestsServerErrorCouldNotTweetDuplicateTweetTweetNotAvailableInvalidMediaUserNotFoundUserUnavailableAccountSuspendedAccountLocked© Copyright 2024, twikit.Built with Sphinx using a theme provided by Read the Docs.*For more info