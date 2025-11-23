import Anthropic from '@anthropic-ai/sdk';
import { LLMProvider, LLMResponse, ConversationMessage } from './llm-provider';

export class AnthropicProvider implements LLMProvider {
    private anthropic: Anthropic;
    private modelName: string;

    constructor(apiKey: string, modelName: string = 'claude-haiku-4-5-20251001') {
        this.anthropic = new Anthropic({ apiKey });
        this.modelName = modelName;
    }

    async generate(systemPrompt: string, userPrompt: string): Promise<LLMResponse> {
        try {
            const message = await this.anthropic.messages.create({
                model: this.modelName,
                max_tokens: 4096,
                system: systemPrompt,
                messages: [
                    { role: "user", content: userPrompt }
                ]
            });

            if (message.content[0].type === 'text') {
                return { text: message.content[0].text };
            }

            return { text: '' };
        } catch (error) {
            console.error('Anthropic generation error:', error);
            throw error;
        }
    }

    async *generateStream(systemPrompt: string, userPrompt: string): AsyncGenerator<string, void, unknown> {
        try {
            const stream = this.anthropic.messages.stream({
                model: this.modelName,
                max_tokens: 4096,
                system: systemPrompt,
                messages: [
                    { role: "user", content: userPrompt }
                ]
            });

            for await (const chunk of stream) {
                if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
                    yield chunk.delta.text;
                }
            }
        } catch (error) {
            console.error('Anthropic streaming error:', error);
            throw error;
        }
    }

    async generateWithHistory(systemPrompt: string, messages: ConversationMessage[]): Promise<LLMResponse> {
        try {
            const anthropicMessages = this.convertToAnthropicFormat(messages);
            const message = await this.anthropic.messages.create({
                model: this.modelName,
                max_tokens: 4096,
                system: systemPrompt,
                messages: anthropicMessages
            });

            if (message.content[0].type === 'text') {
                return { text: message.content[0].text };
            }

            return { text: '' };
        } catch (error) {
            console.error('Anthropic generation with history error:', error);
            throw error;
        }
    }

    async *generateStreamWithHistory(systemPrompt: string, messages: ConversationMessage[]): AsyncGenerator<string, void, unknown> {
        try {
            const anthropicMessages = this.convertToAnthropicFormat(messages);
            const stream = this.anthropic.messages.stream({
                model: this.modelName,
                max_tokens: 4096,
                system: systemPrompt,
                messages: anthropicMessages
            });

            for await (const chunk of stream) {
                if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
                    yield chunk.delta.text;
                }
            }
        } catch (error) {
            console.error('Anthropic streaming with history error:', error);
            throw error;
        }
    }

    private convertToAnthropicFormat(messages: ConversationMessage[]): Array<{ role: 'user' | 'assistant', content: string }> {
        // Claude API uses 'assistant' instead of 'ai'
        return messages.map(msg => ({
            role: msg.role === 'ai' ? 'assistant' as const : 'user' as const,
            content: msg.content
        }));
    }
}
