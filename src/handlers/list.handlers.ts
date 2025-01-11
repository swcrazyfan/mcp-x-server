import { TwitterClient } from '../twitterClient.js';
import { 
    HandlerResponse, 
    TwitterHandler,
    ListHandlerArgs,
    ListCreateArgs,
    ListMemberArgs,
    GetListMembersArgs,
    GetUserListsArgs 
} from '../types/handlers.js';
import { createResponse } from '../utils/response.js';

export const handleCreateList: TwitterHandler<ListCreateArgs> = async (
    client: TwitterClient,
    args: ListCreateArgs
): Promise<HandlerResponse> => {
    try {
        // Ensure we have all required parameters with defaults
        const name = args.name;
        const description = args.description || '';  // Default to empty string if not provided
        const isPrivate = args.private ?? false;    // Default to public if not provided

        const list = await client.v2.createList({
            name,
            description,
            private: isPrivate
        });

        if (!list.data) {
            throw new Error('Failed to create list');
        }

        return createResponse(`Successfully created list: ${list.data.id}`, { list: list.data });
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`Failed to create list: ${error.message}`);
        }
        throw error;
    }
};

export const handleAddUserToList: TwitterHandler<ListMemberArgs> = async (
    client: TwitterClient,
    { listId, username }: ListMemberArgs
): Promise<HandlerResponse> => {
    try {
        const user = await client.v2.userByUsername(username);
        if (!user.data) {
            throw new Error(`User not found: ${username}`);
        }

        await client.v2.addListMember(listId, user.data.id);
        return createResponse(`Successfully added user ${username} to list ${listId}`);
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`Failed to add user to list: ${error.message}`);
        }
        throw error;
    }
};

export const handleRemoveUserFromList: TwitterHandler<ListMemberArgs> = async (
    client: TwitterClient,
    { listId, username }: ListMemberArgs
): Promise<HandlerResponse> => {
    try {
        const user = await client.v2.userByUsername(username);
        if (!user.data) {
            throw new Error(`User not found: ${username}`);
        }

        await client.v2.removeListMember(listId, user.data.id);
        return createResponse(`Successfully removed user ${username} from list ${listId}`);
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`Failed to remove user from list: ${error.message}`);
        }
        throw error;
    }
};

export const handleGetListMembers: TwitterHandler<GetListMembersArgs> = async (
    client: TwitterClient,
    { listId, maxResults, userFields }: GetListMembersArgs
): Promise<HandlerResponse> => {
    try {
        const members = await client.v2.listMembers(listId, {
            max_results: maxResults,
            'user.fields': userFields?.join(',')
        });

        if (!members.data) {
            return createResponse(`No members found for list ${listId}`);
        }

        return createResponse(`List members: ${JSON.stringify(members.data, null, 2)}`);
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`Failed to get list members: ${error.message}`);
        }
        throw error;
    }
};

export const handleGetUserLists: TwitterHandler<GetUserListsArgs> = async (client, args) => {
    try {
        const { username, maxResults = 100 } = args;
        
        const user = await client.v2.userByUsername(username);
        if (!user.data) {
            throw new Error(`User ${username} not found`);
        }

        // Get lists owned by the user
        const ownedLists = await client.v2.listsOwned(user.data.id, {
            max_results: maxResults,
            "list.fields": ["created_at", "follower_count", "member_count", "private", "description"]
        });

        // Get lists the user is a member of
        const memberLists = await client.v2.listMemberships(user.data.id, {
            max_results: maxResults,
            "list.fields": ["created_at", "follower_count", "member_count", "private", "description"]
        });

        // Format the response
        const responseText = `Found ${ownedLists.meta?.result_count || 0} owned lists and ${memberLists.meta?.result_count || 0} list memberships for ${username}`;
        
        return createResponse(responseText, {
            owned: {
                lists: ownedLists.data || [],
                count: ownedLists.meta?.result_count || 0,
                has_more: !!ownedLists.meta?.next_token
            },
            member_of: {
                lists: memberLists.data || [],
                count: memberLists.meta?.result_count || 0,
                has_more: !!memberLists.meta?.next_token
            }
        });
    } catch (error: any) {
        const errorMessage = error?.message || 'Unknown error occurred';
        throw new Error(`Failed to get user lists: ${errorMessage}`);
    }
}; 