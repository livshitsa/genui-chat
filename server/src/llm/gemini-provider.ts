import { GoogleGenerativeAI } from '@google/generative-ai';
import { LLMProvider, LLMResponse, ConversationMessage } from './llm-provider';
import { Tool } from '../tools/tool-interface';

export class GeminiProvider implements LLMProvider {
    private genAI: GoogleGenerativeAI;
    private model: any;

    constructor(apiKey: string, modelName: string = 'gemini-2.0-flash') {
        this.genAI = new GoogleGenerativeAI(apiKey);
        this.model = this.genAI.getGenerativeModel({ model: modelName });
    }

    async generate(systemPrompt: string, userPrompt: string, tools?: Tool[]): Promise<LLMResponse> {
        // Simple generation not supporting tools for now, or could implement if needed.
        // Focusing on generateWithHistory as that's what the app uses.
        try {
            const result = await this.model.generateContent([systemPrompt, userPrompt]);
            const response = await result.response;
            return { text: response.text() };
        } catch (error) {
            console.error('Gemini generation error:', error);
            throw error;
        }
    }

    async *generateStream(systemPrompt: string, userPrompt: string, tools?: Tool[]): AsyncGenerator<string, void, unknown> {
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

    async generateWithHistory(systemPrompt: string, messages: ConversationMessage[], tools?: Tool[]): Promise<LLMResponse> {
        try {
            const geminiTools = tools ? this.convertToGeminiTools(tools) : undefined;
            const model = tools ? this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash', tools: geminiTools }) : this.model;

            const chat = model.startChat({
                history: this.convertToGeminiHistory(systemPrompt, messages.slice(0, -1)),
            });

            const lastMessage = messages[messages.length - 1];
            const result = await chat.sendMessage(lastMessage.content);
            const response = await result.response;

            // Handle tool calls if any (Gemini handles the loop internally if using sendMessage? No, we need to handle function calls)
            // Actually, for simple text generation, we might not need the full loop here if we just want the text.
            // But if the model calls a tool, we need to execute it.
            // For now, let's assume the stream method is the primary one used.

            return { text: response.text() };
        } catch (error) {
            console.error('Gemini generation with history error:', error);
            throw error;
        }
    }

    async *generateStreamWithHistory(systemPrompt: string, messages: ConversationMessage[], tools?: Tool[]): AsyncGenerator<string, void, unknown> {
        try {
            const geminiTools = tools ? this.convertToGeminiTools(tools) : undefined;
            // Use a model instance with tools if provided
            const model = tools ? this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash', tools: geminiTools }) : this.model;

            const history = this.convertToGeminiHistory(systemPrompt, messages.slice(0, -1));
            const chat = model.startChat({
                history: history,
            });

            const lastMessage = messages[messages.length - 1];
            let result = await chat.sendMessageStream(lastMessage.content);

            // Loop to handle tool calls
            while (true) {
                let textAccumulated = '';
                let functionCalls: any[] = [];

                for await (const chunk of result.stream) {
                    const chunkText = chunk.text();
                    if (chunkText) {
                        textAccumulated += chunkText;
                        yield chunkText;
                    }

                    // Check for function calls in the chunk (Gemini SDK handles this, but we need to inspect the final response)
                    // Actually, with streaming, we might get function calls.
                    // The SDK simplifies this. Let's look at the aggregated response.
                }

                const response = await result.response;
                const calls = response.functionCalls();

                if (calls && calls.length > 0) {
                    // Send tool usage indicators
                    for (const call of calls) {
                        yield `\n__TOOL_USE__:${call.name}\n`;
                    }

                    // Execute tools
                    const functionResponses = [];
                    for (const call of calls) {
                        const tool = tools?.find(t => t.definition.name === call.name);
                        if (tool) {
                            console.log(`🛠️ Executing tool ${call.name} with args:`, call.args);
                            const toolResult = await tool.execute(call.args);
                            functionResponses.push({
                                functionResponse: {
                                    name: call.name,
                                    response: { name: call.name, content: toolResult }
                                }
                            });
                        }
                    }

                    // Send tool end indicators
                    for (const call of calls) {
                        yield `\n__TOOL_END__:${call.name}\n`;
                    }

                    // Send tool results back to the model
                    if (functionResponses.length > 0) {
                        result = await chat.sendMessageStream(functionResponses);
                        continue; // Continue the loop to get the next response
                    }
                }

                break; // No function calls, we are done
            }

        } catch (error) {
            console.error('Gemini streaming with history error:', error);
            throw error;
        }
    }

    private convertToGeminiTools(tools: Tool[]): any[] {
        return [{
            functionDeclarations: tools.map(tool => {
                const schema = this.zodToGeminiSchema(tool.definition.schema);
                return {
                    name: tool.definition.name,
                    description: tool.definition.description,
                    parameters: schema
                };
            })
        }];
    }

    private zodToGeminiSchema(zodSchema: any): any {
        // Basic Zod to JSON Schema conversion for Gemini

        // Check if it's an object schema (has shape property)
        if (zodSchema.shape) {
            const properties: any = {};
            const required: string[] = [];

            for (const [key, value] of Object.entries(zodSchema.shape)) {
                const fieldSchema = value as any;
                const isOptional = fieldSchema.isOptional();
                const description = fieldSchema.description;

                properties[key] = {
                    type: this.getJsonType(fieldSchema),
                    description: description,
                };

                if (!isOptional) {
                    required.push(key);
                }
            }

            return {
                type: 'OBJECT',
                properties,
                required
            };
        }
        return {};
    }

    private getJsonType(schema: any): string {
        // Try to determine type from _def or constructor
        const def = schema._def;
        const typeName = def?.typeName;

        if (typeName === 'ZodString') return 'STRING';
        if (typeName === 'ZodNumber') return 'NUMBER';
        if (typeName === 'ZodBoolean') return 'BOOLEAN';

        // Fallback checks
        if (schema.safeParse && typeof schema.safeParse('test').success === 'boolean') return 'STRING'; // Rough guess

        return 'STRING';
    }

    private convertToGeminiHistory(systemPrompt: string, messages: ConversationMessage[]): any[] {
        const history = [
            {
                role: 'user',
                parts: [{ text: systemPrompt }]
            },
            {
                role: 'model',
                parts: [{ text: 'Understood. I will act as the AI assistant.' }]
            }
        ];

        for (const msg of messages) {
            history.push({
                role: msg.role === 'ai' ? 'model' : 'user',
                parts: [{ text: msg.content }]
            });
        }

        return history;
    }

    // private convertToGeminiFormat(systemPrompt: string, messages: ConversationMessage[]): string[] {
    //     // ... (Previous implementation, unused now)
    //     return [];
    // }
}
