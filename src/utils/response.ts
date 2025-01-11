import { HandlerResponse } from '../types/handlers.js';

export function createResponse(text: string): HandlerResponse {
    return {
        content: [{ type: 'text', text }],
        tools: []
    };
} 