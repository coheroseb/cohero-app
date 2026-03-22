// @ts-nocheck


/**
 * @fileOverview An AI flow to answer questions based on an uploaded VIVE report.
 * - getViveReportQa - Processes report text and a user question.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { 
    ViveReportQaInputSchema, 
    ViveReportQaDataSchema, 
    ViveReportQaOutputSchema, 
    type ViveReportQaInput, 
    type ViveReportQaOutput 
} from './types';

export async function getViveReportQa(input: ViveReportQaInput): Promise<ViveReportQaOutput> {
  return viveReportQaFlow(input);
}

const prompt = ai.definePrompt({
  name: 'viveReportQaPrompt',
  input: { schema: ViveReportQaInputSchema },
  output: { schema: ViveReportQaDataSchema },
  prompt: `You are an expert velfærdsforsker at VIVE (Det Nationale Forsknings- og Analysecenter for Velfærd).
Your task is to answer a user's question based EXCLUSIVELY on the provided text from a VIVE report.

**Report Context:**
---
{{{reportText}}}
---

**User's Question:**
"{{{question}}}"

**Instructions:**
1.  Answer the question clearly and pedagogically in Danish.
2.  Your answer must be based ONLY on the provided text. If the answer is not in the text, state that clearly.
3.  Use HTML like \`<p>\`, \`<strong>\`, and \`<ul>/<li>\` to structure your answer for readability.
4.  Identify any specific page references or chapter names mentioned in the text that support your answer.

Your response must be a single JSON object.`,
  config: {
    safetySettings: [
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_LOW_AND_ABOVE' },
    ],
  },
});

const viveReportQaFlow = ai.defineFlow(
  {
    name: 'viveReportQaFlow',
    inputSchema: ViveReportQaInputSchema,
    outputSchema: ViveReportQaOutputSchema,
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
