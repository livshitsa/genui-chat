import { z } from 'zod';

export interface ToolDefinition {
    name: string;
    description: string;
    schema: z.ZodType<any>;
}

export interface Tool {
    definition: ToolDefinition;
    execute(args: any): Promise<any>;
}
