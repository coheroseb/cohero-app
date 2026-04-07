import { ai } from '../genkit';
import { 
    ResearchDiscoveryInputSchema, 
    ResearchDiscoveryDataSchema,
    ResearchDiscoveryOutputSchema,
} from './types';
import { serpApiResearchTool } from '../tools/serpapi-tool';
import { z } from 'genkit';

/**
 * Research Discovery Flow
 * Pipeline: SerpApi Search -> Structured Research Generation
 */
const researchDiscoveryPrompt = ai.definePrompt({
    name: 'researchDiscoveryPrompt',
    input: {
        schema: ResearchDiscoveryInputSchema.extend({
            scholarContext: z.string().optional()
        })
    },
    output: { schema: ResearchDiscoveryDataSchema },
    prompt: `Du er en førende akademisk forsker med speciale i {{profession}} og {{category}}. 
Din opgave er at udarbejde en dybdegående forskningsanalyse baseret på både nyere eksterne kilder og den studerendes eget materiale.

GOOGLE SCHOLAR DATA (Nyeste forskning):
---
{{scholarContext}}
---

STUDERENDES KONTEKST (Indhold fra seminarer):
---
{{seminarContext}}
---

OPGAVE:
1. State of Research: Giv en præcis beskrivelse af den aktuelle videnskabelige konsensus og viden inden for {{category}} i en dansk kontekst. Inddrag både den eksterne forskning fra Google Scholar og hvordan den studerendes materiale taler ind i dette.
2. Kilder: Identificer 3-5 konkrete kilder med fungerende URL'er fra Google Scholar dataen. Sørg for at APA-referencen er korrekt.
3. Forskningsveje: Foreslå 3 innovative og akademisk stærke forskningsveje (problemstillinger). Disse skal tage udgangspunkt i "huller" i den studerendes nuværende seminar-materiale sammenholdt med den nyeste forskning.

VIGTIGT: 
- Svaret SKAL være på dansk og i et klart akademisk sprog.
- Du må bruge din egen dybe viden om {{profession}}, men konkrete kilde-henvisninger skal primært stamme fra den leverede Google Scholar data.
- Sørg for at alle links fungerer og er direkte.
- Tilpas analysen specifikt til professionen {{profession}}.`
});

export const researchDiscovery = ai.defineFlow(
    {
        name: 'researchDiscoveryFlow',
        inputSchema: ResearchDiscoveryInputSchema,
        outputSchema: ResearchDiscoveryOutputSchema,
    },
    async (input) => {
        try {
            console.log(`[RESEARCH-DISCOVERY] Phase 1: SerpApi Lookup for ${input.category}...`);
            
            // Fetch Scholar data via SerpApi with improved Danish-centric query
            const searchQuery = `${input.category} ${input.profession || ''} forskning dansk peer reviewed`;
            const scholarResults = await serpApiResearchTool({
                query: searchQuery,
                numResults: 8 // Slightly more results for better coverage
            });

            const scholarContext = scholarResults.results.length > 0
                ? scholarResults.results.map(r => `- ${r.title} (${r.source}): ${r.link} | ${r.snippet}`).join('\n')
                : "Ingen specifikke nyere scholar-resultater fundet. Brug din generelle viden om feltet.";

            // Remove the 8000 char bottleneck - Gemini can handle much more. 
            // We still cap it at a reasonable safety limit (e.g., 100k) to avoid extreme cases.
            const safeContext = input.seminarContext?.substring(0, 100000) || '';

            console.log(`[RESEARCH-DISCOVERY] Phase 2: Generating Structured Research Analysis...`);
            
            const result = await researchDiscoveryPrompt({
                category: input.category,
                profession: input.profession,
                seminarContext: safeContext,
                scholarContext
            });

            if (!result.output) {
                throw new Error("Generation failed to return valid structured data");
            }
            
            return {
                data: result.output,
                usage: {
                    inputTokens: result.usage?.inputTokens || 0,
                    outputTokens: result.usage?.outputTokens || 0,
                }
            };
        } catch (error: any) {
            console.error(`[RESEARCH-DISCOVERY] Pipeline failed:`, error);
            throw error;
        }
    }
);

