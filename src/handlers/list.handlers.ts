import { TwitterClient } from '../twitterClient.js';
import { 
    HandlerResponse, 
    TwitterHandler,
    ListHandlerArgs,
    ListCreateArgs 
} from '../types/handlers.js';

interface ListMemberArgs extends ListHandlerArgs {
    username: string;
}

interface GetListMembersArgs extends ListHandlerArgs {
    maxResults?: number;
    userFields?: string[];
}

export const handleCreateList: TwitterHandler<ListCreateArgs> = async (
    client: TwitterClient,
    { name, description, isPrivate }: ListCreateArgs
): Promise<HandlerResponse> => {
    try {
        const list = await client.v2.createList({
            name,
            description,
            private: isPrivate
        });
        return {
            content: [{ type: 'text', text: `List created with id: ${list.data.id}` }],
        };
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
        const targetUser = await client.v2.userByUsername(username);
        if (!targetUser.data) {
            throw new Error(`User not found: ${username}`);
        }
        await client.v2.addListMember(listId, targetUser.data.id);
        return {
            content: [{ type: 'text', text: `Successfully added user ${username} to list ${listId}` }],
        };
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
        const targetUser = await client.v2.userByUsername(username);
        if (!targetUser.data) {
            throw new Error(`User not found: ${username}`);
        }
        await client.v2.removeListMember(listId, targetUser.data.id);
        return {
            content: [{ type: 'text', text: `Successfully removed user ${username} from list ${listId}` }],
        };
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
        const options: any = {
            max_results: maxResults || 100
        };
        
        if (userFields && userFields.length > 0) {
            options['user.fields'] = userFields.join(',');
        }

        const members = await client.v2.listMembers(listId, options);
        if (!members.data) {
            return {
                content: [{ type: 'text', text: 'No members found in list' }],
            };
        }

        return {
            content: [{ 
                type: 'text', 
                text: `List members: ${JSON.stringify(members.data, null, 2)}` 
            }],
        };
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`Failed to get list members: ${error.message}`);
        }
        throw error;
    }
}; 