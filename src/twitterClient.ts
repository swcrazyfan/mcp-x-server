import { Client } from 'twitter-api-v2';

export type TwitterClient = Client;

export function getTwitterClient() {
    const client = new Client({
        appKey: process.env.X_API_KEY || '',
        appSecret: process.env.X_API_SECRET || '',
        accessToken: process.env.X_ACCESS_TOKEN || '',
        accessSecret: process.env.X_ACCESS_TOKEN_SECRET || '',
    });
    return client;
} 