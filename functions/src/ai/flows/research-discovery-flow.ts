import { ai } from '../genkit';
import { 
    ResearchDiscoveryInputSchema, 
    ResearchDiscoveryDataSchema,
    ResearchDiscoveryOutputSchema,
} from './types';
import { serpApiResearchTool } from '../tools/serpapi-tool';
import { z } from 'genkit';

/**
 * STEP 1: Grounded Text Generation (Using SerpApi results as context)
 * we provide external search results manually to avoid built-in grounding redirect issues.
 */
const groundedTextPrompt = ai.definePrompt({
  name: 'groundedTextPrompt',
  input: { 
    schema: ResearchDiscoveryInputSchema.extend({
      scholarContext: z.string().optional()
    })
  },
  prompt: `Du er en førende akademisk forsker. Din opgave er at lave en dybdegående analyse af dette emne.
Brug følgende søgeresultater fra Google Scholar til at understøtte din analyse.

GOOGLE SCHOLAR DATA:
{{scholarContext}}

STUDERENDES KONTEKST:
Kategori: {{category}}
Uddrag: {{seminarContext}}

OPGAVE:
1. Beskriv "State of Research" (aktuel viden og videnskabelig konsensus).
2. Find 3-5 ægte kilder med fungerende URL'er fra ovenstående data. 
3. Foreslå 3 innovative forskningsveje (titel, problemformulering, spørgsmål, teori).

VIGTIGT: 
- Skriv dit svar i et klart akademisk sprog. 
- Du SKAL inkludere URL'er til kilderne.
- BRUG KUN kilder fra den kontekst du har fået stillet til rådighed (Google Scholar Data).
- Sørg for at alle links fungerer og er direkte (ingen redirects).
- VIGTIGT: Lav din vurdering udelukkende på baggrund af seminarmaterialet og de fundne kilder. Foretag ingen antagelser om felt (f.eks. socialt arbejde) medmindre det fremgår direkte af materialet.`
});

/**
 * STEP 2: JSON Structuring
 */
const structureResearchPrompt = ai.definePrompt({
    name: 'structureResearchPrompt',
    input: { schema: z.object({ text: z.string() }) },
    output: { schema: ResearchDiscoveryDataSchema },
    prompt: `Konverter følgende forsknings-analyse til en struktureret JSON-data pakke.
Vær omhyggelig med at bevare alle kilder, URL'er og de 3 forskningsforslag præcis som de er beskrevet.

TEKST DER SKAL KONVERTERES:
---
{{text}}
---`
});

/**
 * The main flow for research discovery.
 * Pipeline: SerpApi Search -> Grounded Text Gen -> JSON Structuring
 */
export const researchDiscovery = ai.defineFlow(
  {
    name: 'researchDiscoveryFlow',
    inputSchema: ResearchDiscoveryInputSchema,
    outputSchema: ResearchDiscoveryOutputSchema,
  },
  async (input) => {
    try {
      console.log(`[RESEARCH-DISCOVERY] Phase 1: SerpApi Lookup...`);
      
      // Fetch Scholar data via SerpApi
      const scholarResults = await serpApiResearchTool({
        query: `${input.category} academic research peer reviewed`,
        numResults: 6
      });

      const scholarContext = scholarResults.results.length > 0
        ? scholarResults.results.map(r => `- ${r.title} (${r.source}): ${r.link} | ${r.snippet}`).join('\n')
        : "Ingen specifikke scholar-resultater fundet.";

      // Truncate seminar context
      const truncatedContext = input.seminarContext?.substring(0, 8000) || '';

      console.log(`[RESEARCH-DISCOVERY] Phase 2: Grounded Text Generation (via Manual Context)...`);
      
      const textResult = await groundedTextPrompt({
        category: input.category,
        seminarContext: truncatedContext,
        scholarContext
      });

      const groundedText = textResult.text;
      if (!groundedText) throw new Error("Grounded generation failed to return text");

      console.log(`[RESEARCH-DISCOVERY] Phase 3: JSON Structuring...`);

      const jsonResult = await structureResearchPrompt({ text: groundedText });

      if (!jsonResult.output) {
          throw new Error("Structuring failed to return valid data");
      }

      const data = jsonResult.output;
      
      return {
        data,
        usage: {
          inputTokens: (textResult.usage?.inputTokens || 0) + (jsonResult.usage?.inputTokens || 0),
          outputTokens: (textResult.usage?.outputTokens || 0) + (jsonResult.usage?.outputTokens || 0),
        }
      };
    } catch (error: any) {
      console.error(`[RESEARCH-DISCOVERY] pipeline failed:`, error);
      throw error;
    }
  }
);
