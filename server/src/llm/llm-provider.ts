export interface LLMResponse {
    text: string;
}

export interface LLMProvider {
    generate(systemPrompt: string, userPrompt: string): Promise<LLMResponse>;
    generateStream(systemPrompt: string, userPrompt: string): AsyncGenerator<string, void, unknown>;
}
