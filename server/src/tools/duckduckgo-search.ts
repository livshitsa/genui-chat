import { Tool, ToolDefinition } from './tool-interface';
import { search, SafeSearchType } from 'duck-duck-scrape';
import { z } from 'zod';

export class DuckDuckGoSearchTool implements Tool {
    definition: ToolDefinition = {
        name: 'duckduckgo_web_search',
        description: 'Performs a web search using DuckDuckGo to find current information on topics, news, or specific queries. Use this tool when the user asks a question that requires external knowledge or up-to-date information.',
        schema: z.object({
            query: z.string().describe('The search query to execute.'),
        }),
    };

    async execute(args: { query: string }): Promise<any> {
        try {
            console.log(`🔍 Performing DuckDuckGo search for: "${args.query}"`);
            const results = await search(args.query, {
                safeSearch: SafeSearchType.MODERATE,
            });

            if (!results.results || results.results.length === 0) {
                return "No results found.";
            }

            // Format the top 5 results
            const formattedResults = results.results.slice(0, 5).map(result => ({
                title: result.title,
                url: result.url,
                snippet: result.description, // duck-duck-scrape uses 'description' for snippet
            }));

            return JSON.stringify(formattedResults);
        } catch (error) {
            console.error('DuckDuckGo search error:', error);
            return `Error performing search: ${error instanceof Error ? error.message : String(error)}`;
        }
    }
}
