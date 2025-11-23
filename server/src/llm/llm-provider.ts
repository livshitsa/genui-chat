export interface LLMResponse {
    text: string;
}

export interface LLMProvider {
    generate(systemPrompt: string, userPrompt: string): Promise<LLMResponse>;
}
