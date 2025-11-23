export interface LLMResponse {
    text: string;
}

export interface ConversationMessage {
    role: 'user' | 'ai';
    content: string;
}

export interface LLMProvider {
    generate(systemPrompt: string, userPrompt: string): Promise<LLMResponse>;
    generateStream(systemPrompt: string, userPrompt: string): AsyncGenerator<string, void, unknown>;

    // New methods for conversation history
    generateWithHistory(systemPrompt: string, messages: ConversationMessage[]): Promise<LLMResponse>;
    generateStreamWithHistory(systemPrompt: string, messages: ConversationMessage[]): AsyncGenerator<string, void, unknown>;
}
