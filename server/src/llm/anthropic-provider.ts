import Anthropic from '@anthropic-ai/sdk';
import { LLMProvider, LLMResponse, ConversationMessage } from './llm-provider';
import { Tool } from '../tools/tool-interface';

export class AnthropicProvider implements LLMProvider {
    private anthropic: Anthropic;
    private modelName: string;

    constructor(apiKey: string, modelName: string = 'claude-haiku-4-5-20251001') {
        this.anthropic = new Anthropic({ apiKey });
        this.modelName = modelName;
    }

    async generate(systemPrompt: string, userPrompt: string, tools?: Tool[]): Promise<LLMResponse> {
        try {
            const anthropicTools = tools ? this.convertToAnthropicTools(tools) : undefined;
            const message = await this.anthropic.messages.create({
                model: this.modelName,
                max_tokens: 4096,
                system: systemPrompt,
                messages: [
                    { role: "user", content: userPrompt }
                ],
                tools: anthropicTools
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

    async *generateStream(systemPrompt: string, userPrompt: string, tools?: Tool[]): AsyncGenerator<string, void, unknown> {
        try {
            const anthropicTools = tools ? this.convertToAnthropicTools(tools) : undefined;
            const stream = this.anthropic.messages.stream({
                model: this.modelName,
                max_tokens: 4096,
                system: systemPrompt,
                messages: [
                    { role: "user", content: userPrompt }
                ],
                tools: anthropicTools
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

    async generateWithHistory(systemPrompt: string, messages: ConversationMessage[], tools?: Tool[]): Promise<LLMResponse> {
        try {
            const anthropicMessages = this.convertToAnthropicFormat(messages);
            const anthropicTools = tools ? this.convertToAnthropicTools(tools) : undefined;

            const message = await this.anthropic.messages.create({
                model: this.modelName,
                max_tokens: 4096,
                system: systemPrompt,
                messages: anthropicMessages,
                tools: anthropicTools
            });

            // Handle tool use
            if (message.stop_reason === 'tool_use') {
                // For simple generate, we might want to handle it recursively or just return the tool call?
                // But the interface expects text.
                // Let's implement a simple loop here if needed, but for now let's assume stream is primary.
                // Or better, let's implement the loop.

                // Note: Implementing full tool loop for non-streaming is complex without a runner.
                // Since the app uses streaming, I'll focus on that.
            }

            if (message.content[0].type === 'text') {
                return { text: message.content[0].text };
            }

            return { text: '' };
        } catch (error) {
            console.error('Anthropic generation with history error:', error);
            throw error;
        }
    }

    async *generateStreamWithHistory(systemPrompt: string, messages: ConversationMessage[], tools?: Tool[]): AsyncGenerator<string, void, unknown> {
        try {
            let currentMessages = this.convertToAnthropicFormat(messages);
            const anthropicTools = tools ? this.convertToAnthropicTools(tools) : undefined;

            while (true) {
                const stream = await this.anthropic.messages.create({
                    model: this.modelName,
                    max_tokens: 4096,
                    system: systemPrompt,
                    messages: currentMessages,
                    tools: anthropicTools,
                    stream: true,
                });

                let toolUse: any = null;
                let textContent = '';

                for await (const chunk of stream) {
                    if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
                        textContent += chunk.delta.text;
                        yield chunk.delta.text;
                    } else if (chunk.type === 'content_block_start' && chunk.content_block.type === 'tool_use') {
                        toolUse = { ...chunk.content_block, input: '' };
                    } else if (chunk.type === 'content_block_delta' && chunk.delta.type === 'input_json_delta') {
                        if (toolUse) {
                            toolUse.input += chunk.delta.partial_json;
                        }
                    } else if (chunk.type === 'message_delta' && chunk.delta.stop_reason === 'tool_use') {
                        // Tool use finished
                    }
                }

                if (toolUse) {
                    // Send tool usage indicator
                    yield `\n__TOOL_USE__:${toolUse.name}\n`;

                    // Parse input
                    const toolInput = JSON.parse(toolUse.input);
                    const tool = tools?.find(t => t.definition.name === toolUse.name);

                    if (tool) {
                        console.log(`🛠️ Executing tool ${toolUse.name} with args:`, toolInput);
                        const toolResult = await tool.execute(toolInput);

                        // Send tool end indicator
                        yield `\n__TOOL_END__:${toolUse.name}\n`;

                        // Add assistant message with tool use
                        const content: any[] = [];
                        if (textContent) {
                            content.push({ type: 'text', text: textContent });
                        }
                        content.push({ type: 'tool_use', id: toolUse.id, name: toolUse.name, input: toolInput });

                        currentMessages.push({
                            role: 'assistant',
                            content: content
                        });

                        // Add tool result message
                        currentMessages.push({
                            role: 'user',
                            content: [
                                {
                                    type: 'tool_result',
                                    tool_use_id: toolUse.id,
                                    content: typeof toolResult === 'string' ? toolResult : JSON.stringify(toolResult)
                                }
                            ]
                        });

                        continue; // Continue the loop
                    }
                }

                break; // No tool use, done
            }
        } catch (error) {
            console.error('Anthropic streaming with history error:', error);
            throw error;
        }
    }

    private convertToAnthropicFormat(messages: ConversationMessage[]): any[] {
        return messages.map(msg => ({
            role: msg.role === 'ai' ? 'assistant' : 'user',
            content: msg.content
        }));
    }

    private convertToAnthropicTools(tools: Tool[]): any[] {
        return tools.map(tool => ({
            name: tool.definition.name,
            description: tool.definition.description,
            input_schema: this.zodToAnthropicSchema(tool.definition.schema)
        }));
    }

    private zodToAnthropicSchema(zodSchema: any): any {
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
                type: 'object',
                properties,
                required
            };
        }
        return { type: 'object', properties: {} }; // Fallback to empty object schema
    }

    private getJsonType(schema: any): string {
        // Try to determine type from _def or constructor
        const def = schema._def;
        const typeName = def?.typeName;

        if (typeName === 'ZodString') return 'string';
        if (typeName === 'ZodNumber') return 'number';
        if (typeName === 'ZodBoolean') return 'boolean';

        // Fallback checks
        if (schema.safeParse && typeof schema.safeParse('test').success === 'boolean') return 'string'; // Rough guess

        return 'string';
    }
}
