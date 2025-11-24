import { Tool } from '../tools/tool-interface';

export interface LLMResponse {
    text: string;
}

export interface ConversationMessage {
    role: 'user' | 'ai';
    content: string;
}

export interface LLMProvider {
    generate(systemPrompt: string, userPrompt: string, tools?: Tool[]): Promise<LLMResponse>;
    generateStream(systemPrompt: string, userPrompt: string, tools?: Tool[]): AsyncGenerator<string, void, unknown>;

    // New methods for conversation history
    generateWithHistory(systemPrompt: string, messages: ConversationMessage[], tools?: Tool[]): Promise<LLMResponse>;
    generateStreamWithHistory(systemPrompt: string, messages: ConversationMessage[], tools?: Tool[]): AsyncGenerator<string, void, unknown>;
}
