'use server';
/**
 * @fileOverview An AI flow to analyze a reform PDF and extract structured information.
 *
 * - analyzeReformPdf - Analyzes the text of a reform document.
 * - AnalyzeReformInput - The input type for the function.
 * - AnalyzeReformOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import {
  AnalyzeReformInputSchema,
  ReformAnalysisSchema,
  AnalyzeReformOutputSchema,
  type AnalyzeReformInput,
  type AnalyzeReformOutput,
} from './types';


export async function analyzeReformPdf(input: AnalyzeReformInput): Promise<AnalyzeReformOutput> {
  return analyzeReformFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeReformPrompt',
  input: { schema: AnalyzeReformInputSchema },
  output: { schema: ReformAnalysisSchema },
  prompt: `You are an expert legal analyst specializing in Danish social law. Your task is to analyze the provided text of a legislative reform and extract structured, practice-oriented information for social work professionals.

**IMPORTANT:** You MUST base your entire analysis ONLY on the provided texts. Do not use external knowledge.

**Primary Reform Text (The Law):**
---
{{{reformText}}}
---

{{#if agreementText}}
**Supporting Political Agreement Text (For Context):**
---
{{{agreementText}}}
---
{{/if}}

Your task is to populate a JSON object with the following fields, all in Danish:

1.  **title**: Create a short, descriptive title for this analysis (e.g., "Analyse af nye regler for sygedagpenge").
2.  **law**: Identify the primary law being amended (e.g., "Barnets Lov", "Serviceloven").
3.  **effectiveDate**: Extract the date the reform takes effect. Format it as YYYY-MM-DD.
4.  **summary**: Write a brief, high-level summary of the reform's main purpose.
5.  **keyPoints**: Create a list of the 3-5 most important, concrete changes introduced by the reform.
6.  **practiceImpact**: This is the most crucial part. Analyze and explain what these changes mean in practice for a social worker. **Use the supporting political agreement text (if provided) to add depth and context, for example by explaining the *intention* behind a change.** What are the direct consequences for their daily work, documentation, and decision-making?
7.  **category**: Categorize the reform into ONE of the following: "Børn & Unge", "Beskæftigelse", or "Voksne & Handicap".

Your entire response must be a single JSON object that strictly follows the output schema.`,
});

const analyzeReformFlow = ai.defineFlow(
  {
    name: 'analyzeReformFlow',
    inputSchema: AnalyzeReformInputSchema,
    outputSchema: AnalyzeReformOutputSchema,
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
