// @ts-nocheck


/**
 * @fileOverview An AI flow to generate suggested questions based on a report's content.
 * - generateReportQuestions - Processes report text and returns suggestions.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { 
    GenerateReportQuestionsInputSchema, 
    ReportQuestionsDataSchema, 
    GenerateReportQuestionsOutputSchema, 
    type GenerateReportQuestionsInput, 
    type GenerateReportQuestionsOutput 
} from './types';

export async function generateReportQuestions(input: GenerateReportQuestionsInput): Promise<GenerateReportQuestionsOutput> {
  return generateReportQuestionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateReportQuestionsPrompt',
  input: { schema: GenerateReportQuestionsInputSchema },
  output: { schema: ReportQuestionsDataSchema },
  prompt: `You are an expert velfærdsforsker. I will provide you with the text of a VIVE report.
Your task is to generate 3-4 insightful, pedagogical questions that a social work student should ask about this specific report to better understand its core findings, methodology, and practical implications.

**Report Context:**
---
{{{reportText}}}
---

**Instructions:**
1.  Formulate 3-4 questions in Danish.
2.  The questions should be specific to the content provided.
3.  Focus on areas like: "Hvad er de mest overraskende fund?", "Hvilken betydning har resultaterne for sagsbehandlingen?", "Hvilke anbefalinger giver rapporten til praktikere?".

Your response must be a single JSON object with a "suggestions" key containing an array of strings.`,
  config: {
    safetySettings: [
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_LOW_AND_ABOVE' },
    ],
  },
});

const generateReportQuestionsFlow = ai.defineFlow(
  {
    name: 'generateReportQuestionsFlow',
    inputSchema: GenerateReportQuestionsInputSchema,
    outputSchema: GenerateReportQuestionsOutputSchema,
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
