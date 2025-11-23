import { GoogleGenerativeAI } from '@google/generative-ai';
import { LLMProvider, LLMResponse } from './llm-provider';

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
}
