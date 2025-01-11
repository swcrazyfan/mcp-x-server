import { HandlerResponse } from '../types/handlers.js';

export function createResponse(text: string, meta?: Record<string, unknown>): HandlerResponse {
    return {
        content: [{ type: 'text', text }],
        tools: [],
        _meta: meta
    };
} 