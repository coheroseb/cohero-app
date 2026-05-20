import { ai } from '../genkit';
import { z } from 'zod';
import { generalSearchTool } from '../tools/general-search-tool';

const MarketAnalysisInputSchema = z.object({
  features: z.array(z.string()),
  currentArr: z.number(),
  strategicScores: z.object({
    technology: z.number(), // er det svært at kopiere?
    architecture: z.number(), // skalerbarhed
    ip: z.number(), // ejer koden 100%?
    team: z.number(), // kan det drives uden dig?
    data: z.number(), // unik data = stor værdi
  }),
});

const MarketAnalysisOutputSchema = z.object({
  report: z.string(),
  marketMultiplier: z.number(),
  estimatedAssetValue: z.number(),
  competitorBenchmarks: z.array(z.object({
    name: z.string(),
    estimatedValue: z.string(),
    featureOverlap: z.string(),
  })),
});

export const marketAnalysisFlow = ai.defineFlow(
  {
    name: 'marketAnalysisFlow',
    inputSchema: MarketAnalysisInputSchema,
    outputSchema: MarketAnalysisOutputSchema,
  },
  async (input) => {
    // 1. Perform live research on LegalTech/EdTech market 2026
    const searchQuery = `LegalTech and EdTech SaaS valuation multipliers and acquisition trends April 2026 Denmark Europe`;
    const searchResults = await generalSearchTool({ query: searchQuery, numResults: 5 });

    // 2. Analyze market data and generate report
    const { output } = await ai.generate({
      prompt: `Du er en top-tier M&A analytiker specialiseret i LegalTech og EdTech.
      Din opgave er at lave en strategisk værdiansættelse af platformen Cohéro.
      
      DATA GRUNDLAG:
      - Features: ${input.features.join(', ')}
      - Nuværende ARR: ${input.currentArr.toLocaleString('da-DK')} DKK
      - Strategiske Scorer (1-5): ${JSON.stringify(input.strategicScores)}
      - Markeds-research (snippets): ${JSON.stringify(searchResults.results.map(r => r.snippet))}
      
      RETNINGSLINJER:
      1. Vurder en realistisk markeds-multiplier for 2026 baseret på vækst og moat.
      2. Estimer "Replacement Cost" (Asset Value).
      3. Identificer benchmarks.
      4. Skriv en rapport i Markdown (dansk).
      
      VIGTIGT: Returner KUN JSON-objektet i overensstemmelse med schemaet. Ingen forklarende tekst før eller efter JSON.`,
      model: 'googleai/gemini-3.5-flash',
      output: {
        schema: MarketAnalysisOutputSchema,
      }
    });

    if (!output) {
        throw new Error('AI Scan Fejl: Modellen returnerede ikke et gyldigt svar.');
    }

    return output;
  }
);
