// @ts-nocheck

/**
 * @fileOverview An AI flow to analyze a list of tasks and provide optimization suggestions.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { AnalyzeTaskScheduleInputSchema, AnalyzeTaskScheduleOutputSchema } from './types';

export async function analyzeTaskSchedule(input: z.infer<typeof AnalyzeTaskScheduleInputSchema>) {
  const { output } = await ai.generate({
    model: 'googleai/gemini-2.5-flash', // Model updated as per instruction
    output: { schema: AnalyzeTaskScheduleOutputSchema },
    system: `Du er en ekspert i projektledelse med speciale i akademisk arbejde. Din opgave er at analysere en liste af opgaver og gruppens tilgængelighed for en studiegruppe og komme med konkrete, handlingsorienterede forslag til optimering. Svar på dansk.

Fokuser på følgende områder:
1.  **Tilgængelighed & Samarbejde**: Inddrag gruppens tilgængelighed (hvem er fysisk til stede, hvem er online, og hvem er optaget). Foreslå hvornår det er bedst at mødes fysisk vs. online baseret på opgavernes art og gruppens mønstre.
2.  **Flaskehalse**: Identificer personer, der er overbelastede med opgaver, især hvis deadlines ligger tæt på hinanden eller de har begrænset tilgængelighed.
3.  **Afhængigheder**: Find opgaver, der lader til at være afhængige af hinanden, men som ikke er planlagt i en logisk rækkefølge.
4.  **Risici for Deadlines**: Find opgaver med høj prioritet eller mange undertrin, der har en kort eller urealistisk deadline i forhold til gruppens ledige tid.
5.  **Uklare Opgaver**: Identificer opgaver uden en ansvarlig person eller en deadline, da dette udgør en risiko for projektets fremdrift.
6.  **Prioritering**: Evaluer om prioriteterne giver mening. F.eks. om en lav-prioritets opgave blokerer for en høj-prioritets opgave.`,
    prompt: `Analyser følgende opgaveliste og gruppens tilgængelighedsdata for at generere optimeringsforslag:

OPGAVER:
${JSON.stringify(input.tasks, null, 2)}

TILGÆNGELIGHED:
${JSON.stringify(input.availabilities || [], null, 2)}`,
  });

  return output!;
}
