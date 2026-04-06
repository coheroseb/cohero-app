import { ai } from '../genkit';
import { z } from 'zod';
import { getJson } from 'serpapi';

const SerpApiSearchInputSchema = z.object({
  query: z.string(),
  numResults: z.number().optional().default(5),
});

export const serpApiResearchTool = ai.defineTool(
  {
    name: 'serpApiResearchTool',
    description: 'Searches for academic and scientific publications using SerpApi (Google Scholar).',
    inputSchema: SerpApiSearchInputSchema,
    outputSchema: z.object({
      results: z.array(z.object({
        title: z.string(),
        link: z.string().optional(),
        snippet: z.string().optional(),
        source: z.string().optional(),
        date: z.string().optional(),
      }))
    }),
  },
  async (input) => {
    const apiKey = process.env.SERPAPI_API_KEY;
    if (!apiKey) {
      throw new Error('SERPAPI_API_KEY is not set in environment variables');
    }

    try {
      console.log(`[SERPAPI] Searching for: ${input.query}`);
      
      const response = await getJson({
        engine: "google_scholar", // Better for academic research
        q: input.query,
        hl: "da", // Danish language
        gl: "dk", // Denmark
        api_key: apiKey,
      });

      const scholarResults = response.organic_results || [];

      return {
        results: scholarResults.slice(0, input.numResults).map((res: any) => ({
          title: res.title || 'Uden titel',
          link: res.link,
          snippet: res.snippet,
          source: res.publication_info?.summary || 'Ukendt kilde',
          date: res.publication_info?.summary?.match(/\d{4}/)?.[0],
        }))
      };
    } catch (error) {
      console.error('[SERPAPI] Error searching:', error);
      return { results: [] };
    }
  }
);
