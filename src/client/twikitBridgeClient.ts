import { spawn, ChildProcessWithoutNullStreams } from 'child_process';
import { randomUUID } from 'crypto';
import { EventEmitter } from 'events';

interface PendingRequest {
    resolve: (value: any) => void;
    reject: (reason?: any) => void;
    timeout: NodeJS.Timeout;
}

export class TwikitBridgeClient extends EventEmitter {
    private pythonProcess: ChildProcessWithoutNullStreams | null = null;
    private pendingRequests: Map<string, PendingRequest> = new Map();
    private pythonScriptPath: string = 'python_bridge/twikit_service.py'; // Relative to project root
    private command: string; // Was: 'python3', now set by constructor
    private requestTimeoutMs: number = 30000; // 30 seconds
    private serviceReady: boolean = false;
    private serviceReadyPromise: Promise<void>;
    private resolveServiceReady!: () => void;
    private rejectServiceReady!: (reason?: any) => void;

    constructor(pythonExecutablePath: string) {
        super();
        this.command = pythonExecutablePath;
        this.serviceReadyPromise = new Promise((resolve, reject) => {
            this.resolveServiceReady = resolve;
            this.rejectServiceReady = reject;
        });
    }

    public async startService(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.pythonProcess = spawn(this.command, [this.pythonScriptPath], {
                env: { ...process.env },
                cwd: process.cwd(), // Ensure script is found relative to project root
            });

            let stdoutBuffer = '';

            this.pythonProcess.stdout.on('data', (data) => {
                stdoutBuffer += data.toString();
                let newlineIndex;
                while ((newlineIndex = stdoutBuffer.indexOf('\n')) !== -1) {
                    const line = stdoutBuffer.substring(0, newlineIndex);
                    stdoutBuffer = stdoutBuffer.substring(newlineIndex + 1);
                    try {
                        const response = JSON.parse(line);
                        if (response.status === 'ready') {
                            this.serviceReady = true;
                            this.resolveServiceReady(); 
                            resolve(); // Resolve startService promise
                            this.emit('ready');
                            return; // Don't process as a regular response
                        }

                        const requestId = response.id;
                        if (this.pendingRequests.has(requestId)) {
                            const request = this.pendingRequests.get(requestId)!;
                            clearTimeout(request.timeout);
                            if (response.success) {
                                request.resolve(response.data);
                            } else {
                                request.reject(new Error(response.error || 'Unknown Python error'));
                            }
                            this.pendingRequests.delete(requestId);
                        } else if (response.id === null && !response.success && response.error && response.error.includes('Missing TWIKIT_USERNAME')){
                            // This is an initialization error from Python before service is ready
                            console.error(`[TwikitBridgeClient] Python service initialization error: ${response.error}`);
                            this.rejectServiceReady(new Error(response.error));
                            reject(new Error(response.error)); // Reject startService promise for critical init errors
                        }
                    } catch (e) {
                        console.error(`[TwikitBridgeClient] Error parsing JSON from Python: ${line}`, e);
                    }
                }
            });

            this.pythonProcess.stderr.on('data', (data) => {
                console.error(`[TwikitBridgeClient] [Python stderr]: ${data.toString()}`);
            });

            this.pythonProcess.on('exit', (code, signal) => {
                const exitError = new Error(`Python service exited with code ${code} and signal ${signal}`);
                console.error(`[TwikitBridgeClient] Python service exited. Code: ${code}, Signal: ${signal}`);
                this.serviceReady = false;
                this.pythonProcess = null;
                this.pendingRequests.forEach(request => {
                    clearTimeout(request.timeout);
                    request.reject(exitError);
                });
                this.pendingRequests.clear();
                if (!this.serviceReadyPromise) { // if startService hasn't resolved/rejected yet
                     this.rejectServiceReady(exitError);
                     reject(exitError);
                }
                this.emit('exit', code, signal);
            });

            this.pythonProcess.on('error', (err) => {
                console.error('[TwikitBridgeClient] Failed to start Python service:', err);
                this.serviceReady = false;
                this.pythonProcess = null;
                this.rejectServiceReady(err);
                reject(err); // Reject startService promise
            });

            // Timeout for service readiness itself
            const readyTimeout = setTimeout(() => {
                if (!this.serviceReady) {
                    const err = new Error('Python service did not become ready in time');
                    console.error('[TwikitBridgeClient]', err);
                    this.rejectServiceReady(err);
                    reject(err);
                    this.stopService();
                }
            }, this.requestTimeoutMs);

            this.serviceReadyPromise.finally(() => clearTimeout(readyTimeout));
        });
    }

    public async stopService(): Promise<void> {
        if (this.pythonProcess) {
            this.pythonProcess.kill('SIGTERM'); // Send SIGTERM for graceful shutdown
            // Add a timeout for SIGKILL if it doesn't exit gracefully
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait a bit
            if (this.pythonProcess && !this.pythonProcess.killed) {
                this.pythonProcess.kill('SIGKILL');
            }
            this.pythonProcess = null;
        }
        this.serviceReady = false;
    }

    public async sendCommand(action: string, args: any = {}): Promise<any> {
        if (!this.pythonProcess || !this.pythonProcess.stdin || !this.serviceReady) {
            await this.serviceReadyPromise; // Wait for service to be ready if not already
            if (!this.pythonProcess || !this.pythonProcess.stdin || !this.serviceReady) {
                 throw new Error('Python service is not running or not ready.');
            }
        }

        const requestId = randomUUID();
        const command = { id: requestId, action, args };

        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                if (this.pendingRequests.has(requestId)) {
                    this.pendingRequests.delete(requestId);
                    reject(new Error(`Request to Python service timed out for action: ${action}`));
                }
            }, this.requestTimeoutMs);

            this.pendingRequests.set(requestId, { resolve, reject, timeout });

            try {
                 if (this.pythonProcess && this.pythonProcess.stdin) {
                    this.pythonProcess.stdin.write(JSON.stringify(command) + '\n');
                } else {
                    throw new Error("Python process stdin not available.")
                }
            } catch (error) {
                clearTimeout(timeout);
                this.pendingRequests.delete(requestId);
                reject(error);
            }
        });
    }

    // --- Twikit specific methods will go here ---
    // Example:
    async searchTweet(query: string, search_type: string, count: number = 20, cursor?: string): Promise<any> {
        return this.sendCommand('search_tweet', { query, search_type, count, cursor });
    }

    async getUserByScreenName(screen_name: string): Promise<any> {
        return this.sendCommand('get_user_by_screen_name', { screen_name });
    }

    async getUserTweets(user_id: string, tweet_type: string = 'Tweets', count: number = 20, cursor?: string ): Promise<any> {
        // Note: `twikit` get_user_tweets takes `user_id`, `type`, `count`, `cursor`
        // `type` in twikit is 'Tweets', 'TweetsAndReplies', 'Media'
        return this.sendCommand('get_user_tweets', { user_id, type: tweet_type, count, cursor });
    }
    
    async createTweet(text: string, media_ids?: string[], reply_to?: string, poll?: any): Promise<any> {
        const args: any = { text };
        if (media_ids) args.media_ids = media_ids;
        if (reply_to) args.reply_to = reply_to;
        if (poll) args.poll = poll;
        return this.sendCommand('create_tweet', args);
    }

    async getTweetById(id: string): Promise<any> {
        return this.sendCommand('get_tweet_by_id', { id });
    }

    async deleteTweet(id: string): Promise<any> {
        return this.sendCommand('delete_tweet', { id });
    }

    async favoriteTweet(tweet_id: string): Promise<any> {
        return this.sendCommand('favorite_tweet', { tweet_id });
    }

    async unfavoriteTweet(tweet_id: string): Promise<any> {
        return this.sendCommand('unfavorite_tweet', { tweet_id });
    }

    async retweetTweet(tweet_id: string): Promise<any> {
        return this.sendCommand('retweet', { tweet_id });
    }

    async deleteRetweet(tweet_id: string): Promise<any> {
        return this.sendCommand('delete_retweet', { tweet_id });
    }

    async getRetweeters(tweet_id: string, count: number = 20, cursor?: string): Promise<any> {
        return this.sendCommand('get_retweeters', { tweet_id, count, cursor });
    }

    async getUserFavorites(user_id: string, count: number = 20, cursor?: string): Promise<any> {
        return this.sendCommand('get_user_favorites', { user_id, count, cursor });
    }

    async followUser(user_id: string): Promise<any> {
        return this.sendCommand('follow_user', { user_id });
    }

    async unfollowUser(user_id: string): Promise<any> {
        return this.sendCommand('unfollow_user', { user_id });
    }

    async getUserFollowers(user_id: string, count: number = 20, cursor?: string): Promise<any> {
        return this.sendCommand('get_user_followers', { user_id, count, cursor });
    }

    async getUserFollowing(user_id: string, count: number = 20, cursor?: string): Promise<any> {
        return this.sendCommand('get_user_following', { user_id, count, cursor });
    }

    async uploadMedia(path: string, mediaType?: string): Promise<string> {
        // Returns a media_id string
        const args: any = { path };
        if (mediaType) args.media_type = mediaType;
        return this.sendCommand('upload_media', args);
    }

    async createList(name: string, description?: string, privateList?: boolean): Promise<any> {
        // twikit uses client.create_list(name, mode, description, avatar, banner, members)
        // mode: 0 for public, 1 for private. Default is public.
        const mode = privateList ? 1 : 0;
        return this.sendCommand('create_list', { name, description, mode });
    }

    async addUserToList(list_id: string, user_id: string): Promise<any> {
        return this.sendCommand('add_list_member', { list_id, user_id });
    }

    async removeUserFromList(list_id: string, user_id: string): Promise<any> {
        return this.sendCommand('remove_list_member', { list_id, user_id });
    }

    async getListMembers(list_id: string, count: number = 20, cursor?: string): Promise<any> {
        return this.sendCommand('get_list_members', { list_id, count, cursor });
    }

    async getUserLists(user_id: string, count: number = 20, cursor?: string): Promise<any> {
        return this.sendCommand('get_user_lists', { user_id, count, cursor });
    }

    // Add other methods corresponding to twikit.Client methods you plan to use
    // e.g., get_tweet_by_id, favorite_tweet, retweet, etc.
    // Remember to match the method names and argument structures expected by your python_bridge/twikit_service.py
} 