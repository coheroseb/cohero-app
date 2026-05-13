

/**
 * @fileOverview An AI flow to generate a personalized nudge email.
 */

import { ai } from '../genkit';
import { 
    NudgeEmailInputSchema,
    NudgeEmailOutputSchema,
} from './types';

const prompt = ai.definePrompt({
  name: 'nudgeEmailPrompt',
  input: { schema: NudgeEmailInputSchema },
  prompt: `Du skriver en personlig e-mail fra Cohéro (Sebastian) til en studerende ved navn {{userName}}.
Brugeren er medlem af platformen (medlemskab: {{membership}}), men har ikke været aktiv i over 14 dage (faktisk {{daysInactive}} dage).

**Mål:**
Genskab interessen for platformen uden at virke anmassende. Vær ægte nysgerrig på hvordan det går med studiet.

Husk:
1. Nævn at de er et værdsat medlem af Cohéro fællesskabet.
2. Hvis de er "Kollega+", kan du nævne at de har adgang til alle de avancerede værktøjer. Hvis de blot er "Kollega", kan du nævne at vi har savnet dem.
3. Tilbyd hjælp eller opmuntring til studiet.
4. Foreslå at besøge portalen: https://cohero.dk/portal
5. Tonen skal være personlig, uformel og motiverende ("Kollega til kollega").
6. Skriv på dansk.

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
