
/**
 * @fileOverview An AI flow to spark ideas for a brainstorm in a group.
 */

import { ai } from '@/ai/genkit';
import { 
    BrainstormSparkInputSchema,
    BrainstormSparkDataSchema,
    BrainstormSparkOutputSchema,
    type BrainstormSparkInput,
    type BrainstormSparkOutput,
} from './types';

const prompt = ai.definePrompt({
  name: 'brainstormSparkPrompt',
  input: { schema: BrainstormSparkInputSchema },
  output: { schema: BrainstormSparkDataSchema },
  prompt: `Du er en kreativ facilitator for en studiegruppe af socialrådgiverstuderende. Gruppens emne er "{{{topic}}}".

**Eksisterende idéer i gruppen:**
{{#each existingIdeas}}
- {{this}}
{{/each}}

{{#if context}}
**Yderligere kontekst (lovgivning, teori eller noter):**
{{{context}}}
{{/if}}

**Din opgave (på dansk):**
Generér 3 "sparks" – unikke, faglige vinkler eller idéer, som gruppen endnu ikke har overvejet. Disse skal hjælpe dem med at komme videre i deres ideudvikling.

For hvert spark skal du angive:
1. En fængende titel.
2. En kort beskrivelse af idéen og hvorfor den er relevant for socialt arbejde.
3. (Valgfrit) En teoretisk kobling eller henvisning til relevant lovgivning.

Afslut med en kort, motiverende opsummering af, hvordan disse idéer kan styrke deres projekt.

Svaret SKAL være på dansk og returneres som et JSON-objekt.
`,
});

export const brainstormSpark = ai.defineFlow(
  {
    name: 'brainstormSpark',
    inputSchema: BrainstormSparkInputSchema,
    outputSchema: BrainstormSparkOutputSchema,
  },
  async (input) => {
    const { output, usage } = await prompt(input);
    return {
      data: output!,
      usage: {
        inputTokens: usage.inputTokens,
        outputTokens: usage.outputTokens
      }
    };
  }
);
