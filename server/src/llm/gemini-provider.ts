import { GoogleGenerativeAI } from '@google/generative-ai';
import { LLMProvider, LLMResponse, ConversationMessage } from './llm-provider';

export class GeminiProvider implements LLMProvider {
    private genAI: GoogleGenerativeAI;
    private model: any;

    constructor(apiKey: string, modelName: string = 'gemini-2.5-flash') {
        this.genAI = new GoogleGenerativeAI(apiKey);
        this.model = this.genAI.getGenerativeModel({ model: modelName });
    }

    async generate(systemPrompt: string, userPrompt: string): Promise<LLMResponse> {
        try {
            const result = await this.model.generateContent([systemPrompt, userPrompt]);
            const response = await result.response;
            return { text: response.text() };
        } catch (error) {
            console.error('Gemini generation error:', error);
            throw error;
        }
    }

    async *generateStream(systemPrompt: string, userPrompt: string): AsyncGenerator<string, void, unknown> {
        try {
            const result = await this.model.generateContentStream([systemPrompt, userPrompt]);
            for await (const chunk of result.stream) {
                const chunkText = chunk.text();
                if (chunkText) {
                    yield chunkText;
                }
            }
        } catch (error) {
            console.error('Gemini streaming error:', error);
            throw error;
        }
    }

    async generateWithHistory(systemPrompt: string, messages: ConversationMessage[]): Promise<LLMResponse> {
        try {
            // Convert conversation messages to Gemini format
            const geminiMessages = this.convertToGeminiFormat(systemPrompt, messages);
            const result = await this.model.generateContent(geminiMessages);
            const response = await result.response;
            return { text: response.text() };
        } catch (error) {
            console.error('Gemini generation with history error:', error);
            throw error;
        }
    }

    async *generateStreamWithHistory(systemPrompt: string, messages: ConversationMessage[]): AsyncGenerator<string, void, unknown> {
        try {
            // Convert conversation messages to Gemini format
            const geminiMessages = this.convertToGeminiFormat(systemPrompt, messages);
            const result = await this.model.generateContentStream(geminiMessages);
            for await (const chunk of result.stream) {
                const chunkText = chunk.text();
                if (chunkText) {
                    yield chunkText;
                }
            }
        } catch (error) {
            console.error('Gemini streaming with history error:', error);
            throw error;
        }
    }

    private convertToGeminiFormat(systemPrompt: string, messages: ConversationMessage[]): string[] {
        // Gemini uses a simple array of strings alternating between user and model
        // We'll include the system prompt as the first message
        const formattedMessages: string[] = [systemPrompt];

        for (const msg of messages) {
            formattedMessages.push(msg.content);
        }

        return formattedMessages;
    }
}
