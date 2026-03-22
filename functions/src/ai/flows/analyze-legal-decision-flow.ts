// @ts-nocheck


/**
 * @fileOverview An AI flow to analyze and summarize a legal decision.
 * - analyzeLegalDecision - Breaks down an "Afgørelse" into a pedagogical resume.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import {
  AnalyzeLegalDecisionInputSchema,
  LegalDecisionAnalysisDataSchema,
  AnalyzeLegalDecisionOutputSchema,
  type AnalyzeLegalDecisionInput,
  type AnalyzeLegalDecisionOutput,
} from './types';

export async function analyzeLegalDecision(input: AnalyzeLegalDecisionInput): Promise<AnalyzeLegalDecisionOutput> {
  return analyzeLegalDecisionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeLegalDecisionPrompt',
  input: { schema: AnalyzeLegalDecisionInputSchema },
  output: { schema: LegalDecisionAnalysisDataSchema },
  prompt: `Du er en ekspert i dansk socialret og en erfaren mentor for socialrådgiverstuderende.
Din opgave er at lave et pædagogisk resume af en juridisk afgørelse (principmeddelelse).

**Afgørelsens Titel:** "{{{title}}}"
**Afgørelsens Tekst:**
---
{{{fullText}}}
---

**Din opgave (på dansk):**
Udfyld følgende to felter i et JSON-objekt. Brug et letforståeligt men professionelt sprog.

1.  **Hvad er afgørelsen? (hvadErAfgørelsen):** Forklar selve konklusionen eller resultatet af sagen. Hvad blev der besluttet? Gør det konkret og praksisnært.
2.  **På baggrund af hvad? (påBaggrundAfHvad):** Forklar præmisserne for afgørelsen. Hvilke specifikke paragraffer, juridiske principper eller faktiske omstændigheder i sagen blev lagt til grund? 

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

const analyzeLegalDecisionFlow = ai.defineFlow(
  {
    name: 'analyzeLegalDecisionFlow',
    inputSchema: AnalyzeLegalDecisionInputSchema,
    outputSchema: AnalyzeLegalDecisionOutputSchema,
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
