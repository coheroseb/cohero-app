// @ts-nocheck

/**
 * @fileOverview An AI flow to generate a category-specific study plan.
 * - generateCategoryStudyPlanFlow - Creates a stepped study plan for a category.
 */

import { ai } from '@/ai/genkit';
import { 
    GenerateCategoryStudyPlanInputSchema, 
    CategoryStudyPlanSchema, 
    GenerateCategoryStudyPlanOutputSchema, 
    type GenerateCategoryStudyPlanInput, 
    type GenerateCategoryStudyPlanOutput 
} from './types';

const prompt = ai.definePrompt({
  name: 'generateCategoryStudyPlanPrompt',
  input: { schema: GenerateCategoryStudyPlanInputSchema },
  output: { schema: CategoryStudyPlanSchema },
  prompt: `Du er en ekspert i akademisk planlægning for danske socialrådgiverstuderende. Din opgave er at skabe en detaljeret, personlig og pædagogisk stærk studieplan (læseplan) for kategorien "{{{topic}}}".

Her er konteksten fra de seminarer, som den studerende har deltaget i:
{{{context}}}

Din opgave er at analysere denne kontekst og skabe en sekventiel læseplan med konkrete trin (steps).

**Instruktioner for hvert trin:**
1. **Title**: En klar og motiverende overskrift for trinnet.
2. **Description**: En uddybende forklaring af, hvad den studerende skal gøre.
3. **Learning Objective**: Hvad er det konkrete læringsmål? Hvad skal de kunne efter dette trin?
4. **Suggested Method**: Hvordan skal de lære det? (f.eks. "Lav et begrebskort", "Diskutér med en medstuderende", "Lav en juridisk analyse af en fiktiv case baseret på §X").

**Retningslinjer:**
- Planen skal være handlingsorienteret og nem at gå til.
- Den skal bygge ovenpå den eksisterende viden fra seminarerne.
- Brug et professionelt men opmuntrende sprog på dansk.
- Sørg for at dække både de juridiske, teoretiske og praktiske aspekter af kategorien.
- Generér mellem 4 og 7 trin i alt.

Outputtet skal være et JSON objekt med en titel, en overordnet beskrivelse og en liste over disse trin (steps). Hvert trin skal have et unikt ID (f.eks. step-1, step-2...).
`,
   config: {
    temperature: 0.7,
  },
});

export async function generateCategoryStudyPlan(input: GenerateCategoryStudyPlanInput): Promise<GenerateCategoryStudyPlanOutput> {
    return generateCategoryStudyPlanFlow(input);
}

export const generateCategoryStudyPlanFlow = ai.defineFlow(
  {
    name: 'generateCategoryStudyPlanFlow',
    inputSchema: GenerateCategoryStudyPlanInputSchema,
    outputSchema: GenerateCategoryStudyPlanOutputSchema,
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
