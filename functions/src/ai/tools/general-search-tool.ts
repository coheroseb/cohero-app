import { ai } from '../genkit';
import { z } from 'zod';
import { getJson } from 'serpapi';

const GeneralSearchInputSchema = z.object({
  query: z.string(),
  numResults: z.number().optional().default(5),
});

export const generalSearchTool = ai.defineTool(
  {
    name: 'generalSearchTool',
    description: 'Searches the web for general information using SerpApi (Google Search).',
    inputSchema: GeneralSearchInputSchema,
    outputSchema: z.object({
      results: z.array(z.object({
        title: z.string(),
        link: z.string().optional(),
        snippet: z.string().optional(),
        source: z.string().optional(),
      }))
    }),
  },
  async (input) => {
    const apiKey = process.env.SERPAPI_API_KEY;
    if (!apiKey) {
      throw new Error('SERPAPI_API_KEY is not set in environment variables');
    }

    try {
      console.log(`[GENERAL SEARCH] Searching for: ${input.query}`);
      
      const response = await getJson({
        engine: "google",
        q: input.query,
        hl: "da",
        gl: "dk",
        api_key: apiKey,
      });

      const organicResults = response.organic_results || [];

      return {
        results: organicResults.slice(0, input.numResults).map((res: any) => ({
          title: res.title || 'Uden titel',
          link: res.link,
          snippet: res.snippet,
          source: res.displayed_link || 'Ukendt kilde',
        }))
      };
    } catch (error) {
      console.error('[GENERAL SEARCH] Error searching:', error);
      return { results: [] };
    }
  }
);
