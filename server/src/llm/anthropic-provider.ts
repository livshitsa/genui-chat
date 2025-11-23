import Anthropic from '@anthropic-ai/sdk';
import { LLMProvider, LLMResponse } from './llm-provider';

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
}
