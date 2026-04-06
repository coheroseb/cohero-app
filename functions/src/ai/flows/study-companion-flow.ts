'use client';

/**
 * @fileOverview An AI flow to generate a personalized weekly study companion newsletter.
 */

import { ai } from '@/ai/genkit';
import { 
    StudyCompanionInputSchema,
    StudyCompanionOutputSchema,
} from './types';

const prompt = ai.definePrompt({
  name: 'studyCompanionPrompt',
  input: { schema: StudyCompanionInputSchema },
  prompt: `Du er en klog, støttende og inspirerende AI-studiepartner for velfærdsstuderende på Cohéro.
Din opgave er at skrive ugens "Studie-Makker" e-mail til {{userName}}.

**Bruger Kontekst:**
- Profession: {{#if profession}}{{profession}}{{else}}Socialrådgiver{{/if}}
- Semester: {{semester}}
- Uddannelsessted: {{institution}}
- Senest brugte værktøjer: {{#each recentToolsUsed}}{{this}}, {{/each}}

**Din indholds-strategi:**
1. Hils personligt og anerkend deres indsats som velfærdsstuderende.
2. Vælg 1-2 relevante paragraffer fra lovgivningen, som er fundamentale for deres arbejde. 
   - For en "Socialrådgiver", fokuser på Barnets Lov, Serviceloven, Retssikkerhedsloven eller Forvaltningsloven.
   - For en "Pædagog", fokuser på Dagtilbudsloven, Serviceloven (særligt f.eks. § 153 underretning), Folkeskoleloven eller andre relevante love om barnets udvikling og rettigheder.
3. Forklag kort hvorfor disse paragraffer er vigtige lige nu (relater det gerne til deres semester eller hverdagen som {{#if profession}}{{profession}}{{else}}velfærdsprofessionel{{/if}}).
4. Stil ét skarpt "Sokratisk" refleksions-spørgsmål, som kan hjælpe dem med at tænke dybere over teorien og etikken bag lovgivningen og deres praksis.
5. Slut af med en motiverende hilsen fra Sebastian og Cohéro-teamet.

**Tone:**
Inspirerende, fagligt stærkt, men letlæseligt og opmuntrende. Skriv på dansk.

Returner et JSON objekt med 'subject' (fængende emnefelt) og 'content' (selve e-mail teksten i HTML-venligt markdown, brug rige CSS-støttede inline-tags hvis muligt/nødvendigt).
`,
});

export const studyCompanionFlow = ai.defineFlow(
  {
    name: 'studyCompanionFlow',
    inputSchema: StudyCompanionInputSchema,
    outputSchema: StudyCompanionOutputSchema,
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
