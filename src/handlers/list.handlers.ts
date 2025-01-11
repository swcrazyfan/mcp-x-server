import { TwitterClient } from '../twitterClient.js';

export async function handleCreateList(
    client: TwitterClient,
    name: string,
    description: string,
    isPrivate: boolean
) {
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
}

export async function handleAddUserToList(
    client: TwitterClient,
    listId: string,
    username: string
) {
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
}

export async function handleRemoveUserFromList(
    client: TwitterClient,
    listId: string,
    username: string
) {
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
}

export async function handleGetListMembers(
    client: TwitterClient,
    listId: string,
    maxResults?: number,
    userFields?: string[]
) {
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
} 