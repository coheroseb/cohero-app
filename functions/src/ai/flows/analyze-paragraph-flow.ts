// @ts-nocheck


/**
 * @fileOverview An AI flow to provide a structured legal assessment of a law paragraph.
 * - analyzeParagraph - Breaks down a paragraph into Subjekt, Handling, and Betingelser.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import {
  AnalyzeParagraphInputSchema,
  ParagraphAnalysisDataSchema,
  AnalyzeParagraphOutputSchema,
  type AnalyzeParagraphInput,
  type AnalyzeParagraphOutput,
} from './types';

export async function analyzeParagraph(input: AnalyzeParagraphInput): Promise<AnalyzeParagraphOutput> {
  return analyzeParagraphFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeParagraphPrompt',
  input: { schema: AnalyzeParagraphInputSchema },
  output: { schema: ParagraphAnalysisDataSchema },
  prompt: `Du er en ekspert i dansk socialret. Din opgave er at foretage en præcis juridisk dekonstruktion af en specifik paragraf udelukkende baseret på de medsendte kilder.

**KRITISK INSTRUKS:**
1.  **STRENG KILDETROSKAB:** Du må KUN bruge de lovtekster og vejledninger, der er sendt med i denne anmodning. Du er forbudt at bruge ekstern viden eller generel juridisk information.
2.  **INGEN GÆT:** Hvis informationen ikke findes i teksten, skal du lade feltet være tomt eller skrive "Ikke fundet i kilden".

**Kontekst:**
Lov: "{{{lovTitel}}}"
Paragraf: "{{{paragrafNummer}}}"
Tekst: 
---
{{{paragrafTekst}}}
---

**Fulde kildegrundlag (inkl. vejledninger):**
---
{{{fuldLovtekst}}}
---

{{#if urlContext}}
**Supplerende Vejlednings-kontekst:**
{{{urlContext}}}
{{/if}}

**Din opgave (på dansk):**
Analyser paragraffen og udfyld følgende tre felter i et JSON-objekt.

1.  **Subjektet (subjekt):** Hvem henvender reglen sig til? Hvem er målgruppen eller den ansvarlige myndighed ifølge teksten?
2.  **Handlingen (handling):** Hvad er det helt præcist reglen regulerer, tillader eller påbyder? 
3.  **Betingelserne (betingelser):** Hvilke specifikke betingelser skal ifølge kilden være opfyldt, før reglen finder anvendelse? List dem punktvist hvis muligt.

Dit svar SKAL være et JSON-objekt, der matcher output-skemaet.`,
  config: {
    safetySettings: [
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_LOW_AND_ABOVE' },
    ],
  },
});

const analyzeParagraphFlow = ai.defineFlow(
  {
    name: 'analyzeParagraphFlow',
    inputSchema: AnalyzeParagraphInputSchema,
    outputSchema: AnalyzeParagraphOutputSchema,
  },
  async (input) => {
    const { output, usage } = await prompt(input);
    return {
      data: output!,
      usage: {
        inputTokens: usage.inputTokens,
        outputTokens: usage.outputTokens,
      },
    };
  }
);
