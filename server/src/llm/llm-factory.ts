import { LLMProvider } from './llm-provider';
import { GeminiProvider } from './gemini-provider';
import { AnthropicProvider } from './anthropic-provider';

export class LLMFactory {
    static getProvider(model: string): LLMProvider {
        switch (model) {
            case 'anthropic':
                if (!process.env.ANTHROPIC_API_KEY) {
                    throw new Error('ANTHROPIC_API_KEY is not set');
                }
                return new AnthropicProvider(process.env.ANTHROPIC_API_KEY);
            case 'gemini':
            default:
                if (!process.env.GEMINI_API_KEY) {
                    throw new Error('GEMINI_API_KEY is not set');
                }
                return new GeminiProvider(process.env.GEMINI_API_KEY);
        }
    }
}
