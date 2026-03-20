
'use server';
/**
 * @fileOverview An AI flow to explain a case from the Danish Parliament.
 * - explainFolketingetSag - Generates a pedagogical explanation of a case.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import {
  ExplainFTSagInputSchema,
  ExplainFTSagDataSchema,
  ExplainFTSagOutputSchema,
  type ExplainFTSagInput,
  type ExplainFTSagOutput,
} from './types';

export async function explainFolketingetSag(input: ExplainFTSagInput): Promise<ExplainFTSagOutput> {
  return explainFTSagFlow(input);
}

const prompt = ai.definePrompt({
  name: 'explainFTSagPrompt',
  input: { schema: ExplainFTSagInputSchema },
  output: { schema: ExplainFTSagDataSchema },
  prompt: `You are an expert political analyst and educator for Danish social work students.
Your task is to explain a case from the Danish Parliament (Folketinget) in a simple, clear, and practice-oriented way.

The case is:
**Title:** "{{{caseTitle}}}"
{{#if caseResume}}
**Official Summary:** "{{{caseResume}}}"
{{/if}}

Please provide an explanation in Danish, formatted with simple HTML tags like \`<h3>\`, \`<p>\`, and \`<ul>/<li>\`. Your explanation should cover:

1.  **Hvad handler sagen om?** (Summarize the core issue in plain language).
2.  **Hvorfor er det relevant for en socialrådgiver?** (Explain the practical implications for social work).
3.  **Hvad er hovedpointerne?** (List the main arguments or changes being discussed).

Your entire response must be a single JSON object with a single key: "explanation".`,
  config: {
    safetySettings: [
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_LOW_AND_ABOVE' },
    ],
  },
});

const explainFTSagFlow = ai.defineFlow(
  {
    name: 'explainFTSagFlow',
    inputSchema: ExplainFTSagInputSchema,
    outputSchema: ExplainFTSagOutputSchema,
  },
  async (input) => {
    const { output, usage } = await prompt(input);
    return {
      data: output!,
      usage: {
        inputTokens: usage.inputTokens,
        outputTokens: usage.outputTokens,
      },
    };
  }
);
