// @ts-nocheck


import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { RecommendTaskAssigneeInputSchema, RecommendTaskAssigneeOutputSchema } from './types';

export async function recommendTaskAssignee(input: z.infer<typeof RecommendTaskAssigneeInputSchema>) {
  const { output } = await ai.generate({
    model: 'googleai/gemini-2.5-flash',
    output: { schema: RecommendTaskAssigneeOutputSchema },
    system: `Du er en intelligent assistent til studiegrupper. Din opgave er at anbefale hvem en ny opgave skal tildeles til, baseret på opgavens indhold, gruppemedlemmernes nuværende arbejdsbyrde og deres tilgængelighed. Svar på dansk.

Kriterier for anbefaling:
1. **Arbejdsbyrde**: Prioriter medlemmer med færrest aktive opgaver (todo/in-progress).
2. **Tilgængelighed**: Inddrag deres tilgængelighed (fysisk, online). Hvis opgaven virker som noget der kræver fysisk fremmøde, prioriter dem der er "physical".
3. **Relevans**: Hvis opgavens beskrivelse antyder en specifik rolle eller tidligere opgaver, tag det med i overvejelningen.
4. **Fairness**: Forsøg at skabe en jævn fordeling i gruppen.`,
    prompt: `Anbefal en ansvarlig for følgende opgave:

NY OPGAVE:
Titel: ${input.taskTitle}
Beskrivelse: ${input.taskDescription || 'Ingen beskrivelse'}

GRUPPEMEDLEMMER:
${JSON.stringify(input.members, null, 2)}

EKSISTERENDE OPGAVER (Arbejdsbyrde):
${JSON.stringify(input.existingTasks, null, 2)}

TILGÆNGELIGHEDSDATA:
${JSON.stringify(input.availabilities || [], null, 2)}`,
  });

  return output!;
}
