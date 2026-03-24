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
import { getRelevantLawContext } from '../../lib/law-context-helper';

// Enhanced Schema for the Blueprint
const EnhancedExamBlueprintSchema = ExamBlueprintSchema.extend({
    sections: z.array(z.object({
        title: z.string(),
        weight: z.string(),
        wordCountEstimate: z.string(), // e.g. "500-700 ord"
        focus: z.string(),
        theoryLink: z.string(),
        legalFocus: z.string().optional(), // Specific law/paragraph to focus on
    })),
    checklist: z.array(z.string()), // 3-5 quality checks for the student
});

const prompt = ai.definePrompt({
  name: 'examArchitectPrompt',
  input: { schema: PromptInputSchema },
  output: { schema: EnhancedExamBlueprintSchema },
  prompt: `Du er en personlig, strategisk akademisk arkitekt for socialrådgiverstuderende i Danmark. Din opgave er at transformere et råt emne til et knivskarpt, professionelt fundament for en topkarakter (12-tals niveau).

Du tænker ikke bare i afsnit, men i sammenhæng, metodisk stringens og juridisk præcision.

**PROJEKT DETALJER:**
- Opgavetype: {{{assignmentType}}}
- Semester: {{{semester}}}
- Emne: "{{{topic}}}"
- Udkast til Problemformulering: "{{{problemStatement}}}"

**TILGÆNGELIG KONTEKST (DIN ARKIMEDES-VÆGTSTANG):**
- Juridisk Grundlag & Retningslinjer: 
---
{{{lawContext}}}
---

{{#if seminarContext}}
- Studerendes egne seminar-noter & undervisningsfokus:
---
{{{seminarContext}}}
---
{{/if}}

{{#if books}}
- Relevant Pensum (Brug disse specifikt i dine referencer):
{{#each books}}
- {{{this.title}}} (af {{{this.author}}}). Centrale temaer: {{{this.RAG}}}
{{/each}}
{{/if}}

**DIN ARKITEKTONISKE OPGAVE:**
Skab den ultimative byggeplan. Vær konkret, akademisk krævende og vejledende.

Outputtet SKAL være et JSON objekt med følgende vinkler:

1.  **title**: En fængende, præcis og akademisk arbejdstitel.
2.  **draftProblemStatement**: En optimeret, undersøgende og metodisk stærk problemformulering.
3.  **problemStatementTip**: En dybdegående forklaring af, hvorfor denne formulering virker, og et konkret råd til at præcisere den yderligere.
4.  **redThreadAdvice**: Beskriv præcis hvordan den "røde tråd" sikres fra problemformulering til konklusion.
5.  **researchStrategy**: En strategisk køreplan (f.eks: "Start med en diskursanalyse af lovgivningen, brug derefter Honneth til at belyse borgerens perspektiv...").
6.  **sections**: Foreslå 5-6 afsnit. For hvert afsnit:
    - \`title\`: Overskrift.
    - \`weight\`: Vægtning i % (f.eks. "15%").
    - \`wordCountEstimate\`: Estimeret antal ord (f.eks. "400-600 ord").
    - \`focus\`: Hvad er den faglige kerne i dette afsnit? Hvilket spørgsmål besvares her?
    - \`theoryLink\`: Hvilken specifik teori/teoretiker SKAL i spil her?
    - \`legalFocus\`: Hvilken konkret paragraf eller juridisk princip er omdrejningspunktet? (Vær specifik ud fra konteksten).
7.  **suggestedTheories**: De 2-3 vigtigste teorier.
    - \`name\`: Teori/Teoretiker.
    - \`why\`: Forklar den metodiske nødvendighed af netop denne teori til dette emne.
    - \`bookReference\`: Find den mest præcise kilde i pensumlisten ovenfor.
8.  **checklist**: 4 specifikke punkter eleven skal tjekke for at sikre, at opgaven holder den akademiske standard (f.eks. "Er inddragelsesbegrebet defineret jf. Barnets Lov § 5?").

Vær den vejleder, du selv ville ønske, du havde.`,
});

export const generateExamBlueprint = ai.defineFlow(
  {
    name: 'examArchitectFlow',
    inputSchema: ExamArchitectInputSchema,
    outputSchema: ExamArchitectOutputSchema,
  },
  async (input) => {
    console.log(`[EXAM-ARCHITECT] Generating optimized blueprint for: ${input.topic}`);
    
    // Step 1: Optimization - Automatically fetch law context if it's not provided or is generic
    let finalLawContext = input.lawContext || '';
    if (!finalLawContext || finalLawContext.length < 50) {
        console.log(`[EXAM-ARCHITECT] Fetching relevant law context for topic...`);
        finalLawContext = await getRelevantLawContext(input.topic);
    }

    // Step 2: Fetch Books for RAG
    const booksForPrompt = await getCachedBooks();

    // Step 3: Call the enhanced prompt
    const { output, usage } = await prompt({ 
        ...input, 
        lawContext: finalLawContext,
        books: booksForPrompt 
    });

    console.log(`[EXAM-ARCHITECT] Success. Tokens: ${usage.inputTokens + usage.outputTokens}`);

    return {
      data: output!,
      usage: {
        inputTokens: usage.inputTokens || 0,
        outputTokens: usage.outputTokens || 0,
      },
    };
  }
);
