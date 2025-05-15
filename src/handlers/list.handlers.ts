import { TwitterClient as ApiV2Client } from '../client/twitter.js';
import { TwikitBridgeClient } from '../client/twikitBridgeClient.js';
import { HandlerResponse } from '../types/handlers.js';
import { createResponse } from '../utils/response.js';
import { ListV2, UserV2, ApiResponseError } from 'twitter-api-v2';

export interface GetUserListsArgs {
    username: string;
    maxResults?: number;
    pageLimit?: number;
}

export interface CreateListArgs {
    name: string;
    description?: string;
    isPrivate?: boolean;
}

export interface AddUserToListArgs {
    listId: string;
    userId: string;
}

export interface RemoveUserFromListArgs {
    listId: string;
    userId: string;
}

export interface GetListMembersArgs {
    listId: string;
    maxResults?: number;
    pageLimit?: number;
    userFields?: string[];
}

// Type guard to check client type
function isApiV2Client(client: ApiV2Client | TwikitBridgeClient): client is ApiV2Client {
    return client instanceof ApiV2Client;
}

export async function handleGetUserLists(
    client: ApiV2Client | TwikitBridgeClient,
    { username, maxResults = 20 }: { username: string; maxResults?: number; }
): Promise<HandlerResponse> {
    try {
        if (isApiV2Client(client)) {
            const user = await client.v2.userByUsername(username);
            if (!user.data) throw new Error(`User ${username} not found.`);
            const lists = await client.v2.listsOwned(user.data.id, { 'max_results': maxResults });
            return createResponse(`Lists for user ${username}: ${JSON.stringify(lists.data, null, 2)}`);
        } else {
            // Twikit needs user ID. Get it first.
            const user = await client.getUserByScreenName(username);
            if (!user || !user.id) throw new Error(`User ${username} not found via Twikit.`);
            const result = await client.getUserLists(user.id, maxResults);
            return createResponse(`Lists for user ${username} (via Twikit): ${JSON.stringify(result, null, 2)}`);
        }
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`Failed to get user lists: ${error.message}`);
        }
        throw new Error('Failed to get user lists: Unknown error occurred');
    }
}

function formatListInfo(list: ListV2): string {
    const name = list.name.length > 50 ? `${list.name.substring(0, 47)}...` : list.name;
    const description = list.description
        ? list.description.length > 100
            ? `${list.description.substring(0, 97)}...`
            : list.description
        : '';

    return `- ${name} (${list.member_count} members${list.private ? ', private' : ''})${
        description ? `: ${description}` : ''
    }\n`;
}

export async function handleCreateList(
    client: ApiV2Client | TwikitBridgeClient,
    { name, description, isPrivate = false }: { name: string; description?: string; isPrivate?: boolean }
): Promise<HandlerResponse> {
    try {
        if (isApiV2Client(client)) {
            const { data } = await client.v2.createList({ name, description, private: isPrivate });
            return createResponse(`List created: ${data.id} - ${data.name}`);
        } else {
            const result = await client.createList(name, description, isPrivate);
            return createResponse(`List created (via Twikit): ${result.id || JSON.stringify(result)}`);
        }
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`Failed to create list: ${error.message}`);
        }
        throw new Error('Failed to create list: Unknown error occurred');
    }
}

export async function handleAddUserToList(
    client: ApiV2Client | TwikitBridgeClient,
    { listId, userId }: { listId: string; userId: string }
): Promise<HandlerResponse> {
    try {
        if (isApiV2Client(client)) {
            const { data } = await client.v2.addListMember(listId, userId);
            return createResponse(`User ${userId} added to list ${listId}: ${data.is_member}`);
        } else {
            const result = await client.addUserToList(listId, userId);
            return createResponse(`User ${userId} added to list ${listId} (via Twikit): ${result.is_member !== undefined ? result.is_member : JSON.stringify(result)}`);
        }
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`Failed to add user to list: ${error.message}`);
        }
        throw new Error('Failed to add user to list: Unknown error occurred');
    }
}

export async function handleRemoveUserFromList(
    client: ApiV2Client | TwikitBridgeClient,
    { listId, userId }: { listId: string; userId: string }
): Promise<HandlerResponse> {
    try {
        if (isApiV2Client(client)) {
            const { data } = await client.v2.removeListMember(listId, userId);
            return createResponse(`User ${userId} removed from list ${listId}: ${data.is_member}`);
        } else {
            const result = await client.removeUserFromList(listId, userId);
            return createResponse(`User ${userId} removed from list ${listId} (via Twikit): ${result.is_member !== undefined ? !result.is_member : JSON.stringify(result)}`);
        }
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`Failed to remove user from list: ${error.message}`);
        }
        throw new Error('Failed to remove user from list: Unknown error occurred');
    }
}

export async function handleGetListMembers(
    client: ApiV2Client | TwikitBridgeClient,
    { listId, maxResults = 20, userFields }: { listId: string; maxResults?: number; userFields?: string[] }
): Promise<HandlerResponse> {
    try {
        if (isApiV2Client(client)) {
            const users = await client.v2.listMembers(listId, { 'max_results': maxResults, 'user.fields': userFields as any });
            return createResponse(`List members for ${listId}: ${JSON.stringify(users.data, null, 2)}`);
        } else {
            const result = await client.getListMembers(listId, maxResults);
            return createResponse(`List members for ${listId} (via Twikit): ${JSON.stringify(result, null, 2)}`);
        }
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`Failed to get list members: ${error.message}`);
        }
        throw new Error('Failed to get list members: Unknown error occurred');
    }
} 