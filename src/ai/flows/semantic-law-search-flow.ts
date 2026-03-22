

/**
 * @fileOverview An AI flow to perform semantic search across the law collection.
 * - semanticLawSearch - Interprets natural language queries and maps them to concrete laws and paragraphs.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import {
  SemanticLawSearchInputSchema,
  SemanticLawSearchDataSchema,
  SemanticLawSearchOutputSchema,
  type SemanticLawSearchInput,
  type SemanticLawSearchOutput,
} from './types';

export async function semanticLawSearch(input: SemanticLawSearchInput): Promise<SemanticLawSearchOutput> {
  return semanticLawSearchFlow(input);
}

const prompt = ai.definePrompt({
  name: 'semanticLawSearchPrompt',
  input: { schema: SemanticLawSearchInputSchema },
  output: { schema: SemanticLawSearchDataSchema },
  prompt: `Du er en ekspert i dansk socialret. Din opgave er at foretage en yderst selektiv og kritisk semantisk søgning baseret på en studerendes spørgsmål.

**BRUGERENS SPØRGSMÅL:** "{{{query}}}"

**JURIDISK KONTEKST (LOVTEKSTER & VEJLEDNINGER):**
---
{{{legalContext}}}
---

**KRITISK INSTRUKS FOR JURIDISK PRÆCISION:**
1.  **VÆR KRITISK OG SELEKTIV:** Du skal KUN foreslå paragraffer, der har direkte og væsentlig relevans for at besvare spørgsmålet. Du må IKKE inkludere paragraffer blot for at fylde listen ud eller fordi de er perifert relaterede. Kvalitet og relevans er altafgørende.
2.  **STRENG KILDETROSKAB:** Du må UDELUKKENDE basere dit svar på den 'JURIDISKE KONTEKST', der er angivet ovenfor. 
3.  **FORBUD MOD EKSTERN VIDEN:** Du er FORBUDT at bruge din generelle viden, eksterne juridiske kilder eller gætte på regler, der ikke findes eksplicit i den ovenstående tekst.
4.  **INGEN RELEVANS = INGEN SVAR:** Hvis den 'JURIDISKE KONTEKST' ikke indeholder en direkte relevant hjemmel til spørgsmålet, skal du skrive dette i resuméet og returnere en tom liste af paragraffer. Det er vigtigere at være korrekt end at give et svar.

**Dine opgaver (på dansk):**
1.  **Analyser spørgsmålet:** Identificer den kerne-juridiske problemstilling.
2.  **Udvælg relevante love:** Vælg kun de love fra konteksten, der er strengt nødvendige.
3.  **Konkrete paragraffer:** Identificer kun de 1-3 mest centrale paragraffer og stykker (f.eks. "§ 32, stk. 1"). Forklar præcis hvorfor denne specifikke regel er den rette hjemmel for spørgsmålet.
4.  **Samlet resumé:** Skriv et præcist juridisk resumé af retsstillingen baseret på kilderne.

Alt output skal være på dansk. Brug et professionelt og juridisk præcist sprog. Brug altid ordet "borger" frem for "klient".

Dit svar SKAL være et JSON-objekt, der matcher output-skemaet præcist.`,
  config: {
    safetySettings: [
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_LOW_AND_ABOVE' },
    ],
  },
});

const semanticLawSearchFlow = ai.defineFlow(
  {
    name: 'semanticLawSearchFlow',
    inputSchema: SemanticLawSearchInputSchema,
    outputSchema: SemanticLawSearchOutputSchema,
  },
  async (input) => {
    const { output, usage } = await prompt(input);
    return {
      data: output!,
      usage: {
        inputTokens: usage.inputTokens ?? 0,
        outputTokens: usage.outputTokens ?? 0,
      },
    };
  }
);
