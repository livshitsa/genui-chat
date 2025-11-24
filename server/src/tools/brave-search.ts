import { Tool, ToolDefinition } from './tool-interface';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { z } from 'zod';

export class BraveSearchTool implements Tool {
    definition: ToolDefinition = {
        name: 'brave_web_search',
        description: 'Performs a web search using Brave Search to find current information on topics, news, or specific queries. Use this tool when the user asks a question that requires external knowledge or up-to-date information.',
        schema: z.object({
            query: z.string().describe('The search query to execute.'),
        }),
    };

    async execute(args: { query: string }): Promise<any> {
        try {
            console.log(`🔍 Performing Brave search for: "${args.query}"`);

            const response = await axios.get('https://search.brave.com/search', {
                params: {
                    q: args.query,
                },
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                },
                timeout: 10000,
            });

            const $ = cheerio.load(response.data);
            const results: Array<{ title: string; url: string; snippet: string }> = [];

            // Brave uses Svelte-based components with specific class names
            // Look for snippet containers
            $('div.snippet').each((i, element) => {
                if (i >= 5) return false; // Limit to 5 results

                const $el = $(element);

                // Find title - usually in a link with class containing 'title'
                const $title = $el.find('a.title, [class*="title"] a, h4 a').first();
                const title = $title.text().trim();
                const url = $title.attr('href') || '';

                // Find description - usually in a div with class containing 'description'
                const $description = $el.find('.description, [class*="description"]').first();
                const snippet = $description.text().trim();

                if (title && url) {
                    results.push({
                        title,
                        url: url.startsWith('http') ? url : `https://search.brave.com${url}`,
                        snippet: snippet || 'No description available',
                    });
                }
            });

            // If no results found with the snippet class, try alternative approach
            if (results.length === 0) {
                $('.result-wrapper, .search-result, [class*="result-"]').each((i, element) => {
                    if (i >= 5) return false;

                    const $el = $(element);
                    const $link = $el.find('a[href]').first();
                    const title = $link.text().trim() || $el.find('[class*="title"]').text().trim();
                    const url = $link.attr('href') || '';
                    const snippet = $el.find('p, [class*="description"], [class*="snippet"]').first().text().trim();

                    if (title && url) {
                        results.push({
                            title,
                            url: url.startsWith('http') ? url : `https://search.brave.com${url}`,
                            snippet: snippet || 'No description available',
                        });
                    }
                });
            }

            if (results.length === 0) {
                return "No results found. The page structure may have changed or the query returned no results.";
            }
            console.info('Brave search results:', results);
            return JSON.stringify(results);
        } catch (error) {
            console.error('Brave search error:', error);
            if (axios.isAxiosError(error)) {
                if (error.code === 'ECONNABORTED') {
                    return 'Error: Search request timed out. Please try again.';
                }
                return `Error performing search: ${error.message}`;
            }
            return `Error performing search: ${error instanceof Error ? error.message : String(error)}`;
        }
    }
}
