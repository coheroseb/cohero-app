
import { ai } from '../genkit';
import { OptimizeSeoInputSchema, OptimizeSeoOutputSchema } from './types';

const seoPrompt = ai.definePrompt({
  name: 'optimizeSeoPrompt',
  input: { schema: OptimizeSeoInputSchema },
  prompt: `
    Du er en SEO ekspert for platformen Cohéro (Cohero). 
    Cohéro er en alt-i-en digital platform for socialrådgiverstuderende i Danmark.
    Platformen tilbyder AI-baseret sparring på journalnotater, case-træning, lovportal og eksamenshjælp.
    
    Din opgave er at optimere sidens globale metadata (title, description og keywords).
    
    Nuværende Titiel: {{currentTitle}}
    Nuværende Beskrivelse: {{currentDescription}}
    Nuværende Keywords: {{currentKeywords}}
    
    Regler:
    1. Titlen skal være fængende, indeholde ordet "Cohéro" og være under 60 tegn.
    2. Beskrivelsen skal sælge værdien af platformen og være mellem 150-160 tegn.
    3. Keywords skal være relevante for socialrådgiverstudiet, AI og dansk lovgivning.
    
    Returner et objekt med optimizedTitle, optimizedDescription og optimizedKeywords.
  `,
});

export const optimizeSeoFlow = ai.defineFlow(
  {
    name: 'optimizeSeo',
    inputSchema: OptimizeSeoInputSchema,
    outputSchema: OptimizeSeoOutputSchema,
  },
  async (input) => {
    const { output, usage } = await seoPrompt(input);
    return {
      data: output!,
      usage: {
        inputTokens: usage.inputTokens || 0,
        outputTokens: usage.outputTokens || 0,
      },
    };
  }
);
