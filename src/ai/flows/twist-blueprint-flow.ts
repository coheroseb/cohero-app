import { ai } from '@/ai/genkit';
import { 
  TwistBlueprintInputSchema, 
  TwistBlueprintOutputSchema 
} from './types';
import { z } from 'zod';

const prompt = ai.definePrompt({
  name: 'twistBlueprintPrompt',
  input: { schema: TwistBlueprintInputSchema },
  output: { schema: TwistBlueprintOutputSchema },
  prompt: `Du er en akademisk vejleder. En studerende har fået en byggeplan for deres opgave, men ønsker at "twiste" deres problemformulering med en ny vinkel.

**Nuværende Plan:**
- Titel: {{{blueprintTitle}}}
- Problemformulering: {{{currentProblemStatement}}}

**Brugerens ønskede Twist/Ændring:**
"{{{twist}}}"

**Din Opgave:**
Garantér at det nye twist bliver integreret i en skarpskåren, akademisk problemformulering.
Giv også et nyt tip til hvordan de arbejder videre med denne specifikke vinkel. Alt skal være på dansk.

Outputtet skal være et JSON objekt med nøglerne:
1. \`newProblemStatement\`: Den reviderede problemformulering.
2. \`newTip\`: Et nyt, relevant tip til den reviderede vinkel.`,
});

export async function twistBlueprintFlow(input: z.infer<typeof TwistBlueprintInputSchema>) {
  const { output, usage } = await prompt(input);
  return {
    data: output!,
    usage: {
      inputTokens: usage.inputTokens || 0,
      outputTokens: usage.outputTokens || 0,
    },
  };
}
