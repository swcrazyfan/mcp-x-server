import { TwitterApi, ApiResponseError, ApiRequestError } from 'twitter-api-v2';

export interface TwitterCredentials {
    appKey: string;
    appSecret: string;
    accessToken: string;
    accessSecret: string;
}

const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes in milliseconds
const MAX_RETRIES = 3;

export class TwitterClient extends TwitterApi {
    private rateLimitRetryCount: Map<string, number>;
    private rateLimitResetTime: Map<string, number>;

    constructor(credentials: TwitterCredentials) {
        super(credentials);
        this.rateLimitRetryCount = new Map();
        this.rateLimitResetTime = new Map();
    }

    private async handleRateLimit(endpoint: string, error: ApiResponseError | ApiRequestError): Promise<void> {
        if (error instanceof ApiResponseError && error.rateLimitError && error.rateLimit) {
            const { remaining, reset } = error.rateLimit;
            
            if (remaining === 0) {
                const retryCount = this.rateLimitRetryCount.get(endpoint) || 0;
                
                if (retryCount >= MAX_RETRIES) {
                    throw new Error(`Rate limit exceeded for ${endpoint}. Max retries reached.`);
                }

                const resetTime = reset * 1000; // Convert to milliseconds
                this.rateLimitResetTime.set(endpoint, resetTime);
                this.rateLimitRetryCount.set(endpoint, retryCount + 1);

                const waitTime = resetTime - Date.now();
                if (waitTime > 0) {
                    console.log(`Rate limit hit for ${endpoint}. Waiting ${Math.ceil(waitTime / 1000)} seconds...`);
                    await new Promise(resolve => setTimeout(resolve, waitTime));
                }
            }
        }
    }

    private async withRateLimitRetry<T>(endpoint: string, operation: () => Promise<T>): Promise<T> {
        try {
            const result = await operation();
            // Reset retry count on successful operation
            this.rateLimitRetryCount.delete(endpoint);
            this.rateLimitResetTime.delete(endpoint);
            return result;
        } catch (error) {
            if (error instanceof ApiResponseError || error instanceof ApiRequestError) {
                await this.handleRateLimit(endpoint, error);
                // Retry the operation
                return this.withRateLimitRetry(endpoint, operation);
            }
            throw error;
        }
    }

    async getUserByUsername(username: string) {
        return this.withRateLimitRetry('getUserByUsername', () => 
            this.v2.userByUsername(username)
        );
    }

    async getOwnedLists(userId: string, options: any) {
        return this.withRateLimitRetry('getOwnedLists', () => 
            this.v2.listsOwned(userId, options)
        );
    }

    async getListMemberships(userId: string, options: any) {
        return this.withRateLimitRetry('getListMemberships', () => 
            this.v2.listMemberships(userId, options)
        );
    }

    async createList(name: string, description: string = '', isPrivate: boolean = false) {
        return this.withRateLimitRetry('createList', () => 
            this.v2.createList({
                name,
                description,
                private: isPrivate
            })
        );
    }

    async addListMember(listId: string, userId: string) {
        return this.withRateLimitRetry('addListMember', () => 
            this.v2.addListMember(listId, userId)
        );
    }

    async removeListMember(listId: string, userId: string) {
        return this.withRateLimitRetry('removeListMember', () => 
            this.v2.removeListMember(listId, userId)
        );
    }

    async getListMembers(listId: string, options: any) {
        return this.withRateLimitRetry('getListMembers', () => 
            this.v2.listMembers(listId, options)
        );
    }
} 