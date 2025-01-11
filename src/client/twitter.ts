import { 
    TwitterApi, 
    ApiResponseError, 
    ApiRequestError, 
    TwitterApiReadOnly, 
    ListV2, 
    UserV2,
    UserOwnedListsV2Paginator,
    UserListMembershipsV2Paginator,
    UserListMembersV2Paginator,
    ListTimelineV2Result,
    UserV2TimelineResult
} from 'twitter-api-v2';

export interface TwitterCredentials {
    appKey: string;
    appSecret: string;
    accessToken: string;
    accessSecret: string;
}

export interface PaginationOptions {
    maxResults?: number;
    pageLimit?: number;
}

export interface PaginatedResponse<T> {
    data: T[];
    meta: {
        result_count: number;
        total_retrieved: number;
        next_token?: string;
    };
}

const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes in milliseconds
const MAX_RETRIES = 3;
const DEFAULT_PAGE_LIMIT = 10;
const MAX_RESULTS_PER_PAGE = 100;

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

    private async *paginateResults<T, P extends { data: { data: T[] }; meta: { next_token?: string }; next(): Promise<P> }>(
        endpoint: string,
        initialFetch: () => Promise<P>,
        options: PaginationOptions = {}
    ): AsyncGenerator<T[], void, unknown> {
        const { maxResults, pageLimit = DEFAULT_PAGE_LIMIT } = options;
        let currentPage = 0;
        let totalResults = 0;
        
        try {
            let paginator = await this.withRateLimitRetry(endpoint, initialFetch);
            
            while (
                paginator.data?.data?.length > 0 && 
                currentPage < pageLimit && 
                (!maxResults || totalResults < maxResults)
            ) {
                const results = paginator.data.data;
                totalResults += results.length;
                yield results;
                
                if (!paginator.meta.next_token) {
                    break;
                }
                
                currentPage++;
                paginator = await this.withRateLimitRetry(endpoint, () => paginator.next());
            }
        } catch (error) {
            console.error(`Error during pagination for ${endpoint}:`, error);
            throw error;
        }
    }

    async getUserByUsername(username: string) {
        return this.withRateLimitRetry('getUserByUsername', () => 
            this.v2.userByUsername(username)
        );
    }

    async getOwnedLists(userId: string, options: any): Promise<PaginatedResponse<ListV2>> {
        const paginationOptions: PaginationOptions = {
            maxResults: options.max_results,
            pageLimit: options.pageLimit
        };

        const allLists: ListV2[] = [];
        const iterator = this.paginateResults<ListV2, UserOwnedListsV2Paginator>(
            'getOwnedLists',
            () => this.v2.listsOwned(userId, {
                ...options,
                max_results: Math.min(options.max_results || MAX_RESULTS_PER_PAGE, MAX_RESULTS_PER_PAGE)
            }),
            paginationOptions
        );

        for await (const lists of iterator) {
            allLists.push(...lists);
            if (paginationOptions.maxResults && allLists.length >= paginationOptions.maxResults) {
                allLists.length = paginationOptions.maxResults;
                break;
            }
        }

        return {
            data: allLists,
            meta: {
                result_count: allLists.length,
                total_retrieved: allLists.length
            }
        };
    }

    async getListMemberships(userId: string, options: any): Promise<PaginatedResponse<ListV2>> {
        const paginationOptions: PaginationOptions = {
            maxResults: options.max_results,
            pageLimit: options.pageLimit
        };

        const allMemberships: ListV2[] = [];
        const iterator = this.paginateResults<ListV2, UserListMembershipsV2Paginator>(
            'getListMemberships',
            () => this.v2.listMemberships(userId, {
                ...options,
                max_results: Math.min(options.max_results || MAX_RESULTS_PER_PAGE, MAX_RESULTS_PER_PAGE)
            }),
            paginationOptions
        );

        for await (const memberships of iterator) {
            allMemberships.push(...memberships);
            if (paginationOptions.maxResults && allMemberships.length >= paginationOptions.maxResults) {
                allMemberships.length = paginationOptions.maxResults;
                break;
            }
        }

        return {
            data: allMemberships,
            meta: {
                result_count: allMemberships.length,
                total_retrieved: allMemberships.length
            }
        };
    }

    async getListMembers(listId: string, options: any): Promise<PaginatedResponse<UserV2>> {
        const paginationOptions: PaginationOptions = {
            maxResults: options.max_results,
            pageLimit: options.pageLimit
        };

        const allMembers: UserV2[] = [];
        const iterator = this.paginateResults<UserV2, UserListMembersV2Paginator>(
            'getListMembers',
            () => this.v2.listMembers(listId, {
                ...options,
                max_results: Math.min(options.max_results || MAX_RESULTS_PER_PAGE, MAX_RESULTS_PER_PAGE)
            }),
            paginationOptions
        );

        for await (const members of iterator) {
            allMembers.push(...members);
            if (paginationOptions.maxResults && allMembers.length >= paginationOptions.maxResults) {
                allMembers.length = paginationOptions.maxResults;
                break;
            }
        }

        return {
            data: allMembers,
            meta: {
                result_count: allMembers.length,
                total_retrieved: allMembers.length
            }
        };
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
        // Add a small delay before the operation to help prevent rate limits
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        return this.withRateLimitRetry('addListMember', () => 
            this.v2.addListMember(listId, userId)
        );
    }

    async removeListMember(listId: string, userId: string) {
        return this.withRateLimitRetry('removeListMember', () => 
            this.v2.removeListMember(listId, userId)
        );
    }

    async getUserById(userId: string) {
        return this.withRateLimitRetry('getUserById', () => 
            this.v2.user(userId, {
                'user.fields': ['username', 'name', 'verified']
            })
        );
    }

    async getList(listId: string) {
        return this.withRateLimitRetry('getList', () => 
            this.v2.list(listId, {
                'list.fields': ['created_at', 'follower_count', 'member_count', 'private', 'description']
            })
        );
    }
} 