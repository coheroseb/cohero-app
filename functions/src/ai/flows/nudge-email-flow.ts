'use client';

/**
 * @fileOverview An AI flow to generate a personalized nudge email.
 */

import { ai } from '@/ai/genkit';
import { 
    NudgeEmailInputSchema,
    NudgeEmailOutputSchema,
} from './types';

const prompt = ai.definePrompt({
  name: 'nudgeEmailPrompt',
  input: { schema: NudgeEmailInputSchema },
  prompt: `Du skriver en personlig e-mail fra Cohéro (Sebastian) til en studerende ved navn {{userName}}.
Brugeren er "Kollega+" medlem, men har ikke været aktiv på platformen i over 14 dage (faktisk {{daysInactive}} dage).

**Mål:**
Genskab interessen for platformen uden at virke anmassende. Vær ægte nysgerrig på hvordan det går med studiet.

Husk:
1. Nævn at de er et værdsat "Kollega+" medlem.
2. Tilbyd hjælp eller opmuntring til studiet.
3. Foreslå at besøge portalen: https://cohero.dk/portal
4. Tonen skal være personlig, uformel og motiverende ("Kollega til kollega").
5. Skriv på dansk.

Returner et JSON objekt med 'subject' (fængende emnefelt) og 'content' (selve e-mail teksten i ren tekst/markdown).
`,
});

export const nudgeEmailFlow = ai.defineFlow(
  {
    name: 'nudgeEmailFlow',
    inputSchema: NudgeEmailInputSchema,
    outputSchema: NudgeEmailOutputSchema,
  },
  async (input) => {
    const { output, usage } = await prompt(input);
    return {
      data: output!,
      usage: {
        inputTokens: usage.inputTokens || 0,
        outputTokens: usage.outputTokens || 0
      }
    };
  }
);
