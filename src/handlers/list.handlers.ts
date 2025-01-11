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