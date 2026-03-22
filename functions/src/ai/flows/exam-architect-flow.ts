// @ts-nocheck
/**
 * @fileOverview An AI-powered tool to create a blueprint for academic assignments.
 *
 * - generateExamBlueprint - Generates a structured plan for a student's exam or assignment.
 * - ExamArchitectInput - The input type for the function.
 * - ExamArchitectOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import {
  ExamArchitectInputSchema,
  ExamBlueprintSchema,
  ExamArchitectOutputSchema,
  PromptInputSchema,
  type ExamArchitectInput,
  type ExamArchitectOutput,
} from './types';
import { getCachedBooks } from './book-cache';


export async function generateExamBlueprint(input: ExamArchitectInput): Promise<ExamArchitectOutput> {
  return examArchitectFlow(input);
}

const prompt = ai.definePrompt({
  name: 'examArchitectPrompt',
  input: { schema: PromptInputSchema },
  output: { schema: ExamBlueprintSchema },
  prompt: `Du er en erfaren akademisk vejleder for socialrådgiverstuderende i Danmark. Din opgave er at skabe en "Byggeplan" (blueprint) for en opgave, der ikke bare er en liste af afsnit, men en strategisk arkitektur for akademisk succes.

**Studerendes Detaljer:**
- Opgavetype: {{{assignmentType}}}
- Semester: {{{semester}}}
- Emne: "{{{topic}}}"
- Udkast til Problemformulering: "{{{problemStatement}}}"

**Kontekstuel Information:**
- Relevant Jura: {{{lawContext}}}
{{#if seminarContext}}
- Studerendes egne seminar-noter (brug dette til at skabe sammenhæng med undervisningen):
---
{{{seminarContext}}}
---
{{/if}}
{{#if books}}
- Tilgængelig Pensum (RAG-uddrag):
{{#each books}}
- Titel: {{{this.title}}}, Forfatter: {{{this.author}}}, Indhold: {{{this.RAG}}}
{{/each}}
{{/if}}

**Din Opgave:**
Skab en detaljeret byggeplan på dansk. Vær kritisk, akademisk og konstruktiv.
Outputtet skal være et JSON objekt med følgende nøgler:

1.  **title**: En fængende og præcis akademisk arbejdstitel.
2.  **draftProblemStatement**: En skarp, akademisk problemformulering baseret på elevens input. Den skal være specifik og undersøgende.
3.  **problemStatementTip**: Et konkret råd til hvordan eleven kan gøre problemformuleringen endnu skarpere (forklar *hvorfor*).
4.  **redThreadAdvice**: En vejledning i hvordan den "røde tråd" bevares gennem hele opgaven.
5.  **researchStrategy**: En strategisk overvejelse om hvordan eleven skal gribe undersøgelsen an (f.eks. valg af metode eller fokusområde).
6.  **sections**: Foreslå 5-6 logiske afsnit. For hvert afsnit:
    - \`title\`: Overskrift.
    - \`weight\`: Estimeret vægtning i procent (f.eks. "20%").
    - \`focus\`: Hvad skal afsnittet indeholde og hvorfor?
    - \`theoryLink\`: Navngiv en specifik teori eller teoretiker der er central her.
7.  **suggestedTheories**: Anbefal 2-3 nøgleteorier. For hver:
    - \`name\`: Teorien/Teoretikerens navn.
    - \`why\`: Hvorfor er den uundværlig for lige netop denne opgave?
    - \`bookReference\`: **KRITISK:** Søg KUN i den tilgængelige pensumliste. Find præcise match. Hvis intet match findes, udelad feltet.

Vær ambitiøs på elevens vegne.`,
});

const examArchitectFlow = ai.defineFlow(
  {
    name: 'examArchitectFlow',
    inputSchema: ExamArchitectInputSchema,
    outputSchema: ExamArchitectOutputSchema,
  },
  async (input) => {
    const booksForPrompt = await getCachedBooks();

    const { output, usage } = await prompt({ ...input, books: booksForPrompt });

    return {
      data: output!,
      usage: {
        inputTokens: usage.inputTokens || 0,
        outputTokens: usage.outputTokens || 0,
      },
    };
  }
);
