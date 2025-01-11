import { HandlerResponse } from '../types/handlers.js';

export function createResponse(text: string, tools?: Record<string, any>): HandlerResponse {
    return {
        response: text,
        tools
    };
} 