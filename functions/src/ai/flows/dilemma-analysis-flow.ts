// @ts-nocheck

/**
 * @fileOverview An AI flow to analyze the results of the weekly dilemma.
 *
 * - analyzeDilemma - Analyzes votes and justifications.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { 
    DilemmaAnalysisInputSchema,
    DilemmaAnalysisDataSchema,
    DilemmaAnalysisOutputSchema,
    type DilemmaAnalysisInput,
    type DilemmaAnalysisOutput,
} from './types';
import { getRelevantLawContext } from '@/lib/law-context-helper';

export async function analyzeDilemma(input: Omit<DilemmaAnalysisInput, 'lawContext'>): Promise<DilemmaAnalysisOutput> {
  const lawContext = await getRelevantLawContext(input.question);
  return dilemmaAnalysisFlow({ ...input, lawContext });
}

const PromptInputWithContext = DilemmaAnalysisInputSchema.extend({
  lawContext: z.string().optional(),
});

const prompt = ai.definePrompt({
  name: 'dilemmaAnalysisPrompt',
  input: { schema: PromptInputWithContext },
  output: { schema: DilemmaAnalysisDataSchema },
  prompt: `You are an expert social work professor and ethicist in Denmark. Your task is to analyze the justifications provided by social work students for their choices in a weekly ethical dilemma.

**Dilemma:** "{{{question}}}"

**Options:**
{{#each options}}
- **{{this.id}}**: {{this.text}}
{{/each}}

**Student Justifications (Grouped by Choice):**
{{#each options}}
---
**Justifications for Option {{this.id}}:**
{{#each ../votes}}
{{#if (eq this.choiceId ../../this.id)}}
- "{{this.justification}}"
{{/if}}
{{/each}}
---
{{/each}}

**Relevant Legal Context (for your reference):**
---
{{{lawContext}}}
---

**Your Task (in Danish):**
Write a comprehensive analysis of the voting patterns and justifications. Structure your response with simple HTML tags (\`<h3>\`, \`<p>\`, \`<ul>\`, \`<li>\`, \`<strong>\`).
Your analysis must include:
1.  A heading for each option (e.g., \`<h3>Analyse af Valg A</h3>\`).
2.  For each option, analyze the justifications provided. Identify the main arguments, faglige perspektiver (e.g., retssikkerhed, borgerinddragelse), and potential ethical or legal pitfalls revealed by the students' reasoning.
3.  Reference the provided legal context where relevant to highlight correct or incorrect assumptions in the students' justifications.
4.  Conclude with a summary of the key learning points and reflective questions that the overall distribution of votes and arguments gives rise to.

Your entire response MUST be a JSON object with a single key "analysis" containing the complete HTML string.
`,
  config: {
    safetySettings: [
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_LOW_AND_ABOVE' },
    ],
  },
});

const dilemmaAnalysisFlow = ai.defineFlow(
  {
    name: 'dilemmaAnalysisFlow',
    inputSchema: PromptInputWithContext,
    outputSchema: DilemmaAnalysisOutputSchema,
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
