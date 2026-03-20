'use server';
/**
 * @fileOverview An AI-powered tool to create a blueprint for academic assignments.
 *
 * - generateExamBlueprint - Generates a structured plan for a student's exam or assignment.
 * - ExamArchitectInput - The input type for the function.
 * - ExamArchitectOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
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
  prompt: `You are an experienced academic supervisor for social work students in Denmark. Your task is to create a "Byggeplan" (blueprint) for an assignment. Your analysis and suggestions MUST be grounded in the provided context.

**Student's Details:**
- Assignment Type: {{{assignmentType}}}
- Semester: {{{semester}}}
- Topic: "{{{topic}}}"
- Draft Problem Statement: "{{{problemStatement}}}"

**Contextual Information:**
- Relevant Law Context: {{{lawContext}}}
{{#if seminarContext}}
- Student's Own Processed Seminar Notes (to use for inspiration and context):
---
{{{seminarContext}}}
---
{{/if}}
{{#if books}}
- Available Curriculum Books (Content Info contains keywords, topics, and excerpts):
{{#each books}}
- Title: {{{this.title}}}, Author: {{{this.author}}}, Content Info: {{{this.RAG}}}
{{/each}}
{{/if}}

**Your Task:**
Create a detailed blueprint for the assignment. All output MUST be in Danish.
Your response MUST be a JSON object with the following keys:

1.  **title**: Generate a concise and academic working title for the assignment.
2.  **draftProblemStatement**: Based on the student's topic and draft, create a refined, academic problem statement. It should be specific, researchable, and clearly state what will be investigated.
3.  **problemStatementTip**: Provide one sharp, constructive tip to further refine the generated problem formulation, explaining *why* the refinement is an improvement.
4.  **redThreadAdvice**: Provide a short paragraph of advice on how the student can maintain the "røde tråd" (common thread) throughout their assignment, connecting the different sections.
5.  **sections**: Propose a logical structure with 5-6 sections. For each section, provide:
    - \`title\`: The section's title (e.g., "Indledning", "Teoretisk Fundament", "Analyse").
    - \`weight\`: An estimated percentage of the total page count (e.g., "15%").
    - \`focus\`: A brief description of the section's purpose and content.
    - \`theoryLink\`: Optionally, name a key theory relevant to this section.
6.  **suggestedTheories**: Recommend 2 key theories or concepts relevant to the topic. For each, provide:
    - \`name\`: The name of the theory or theorist.
    - \`why\`: A short explanation of why it is relevant for this specific assignment.
    - \`bookReference\`: **CRITICAL:** Search ONLY the 'AVAILABLE BOOKS' list. When searching, consider related forms of words (e.g., for 'anerkendelse', also look for 'anerkendende'). If a book seems to cover the suggested theory (check title, author, and Content Info), include its title. If no clear match is found in the list, you MUST omit this field. Do not invent sources.
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
        inputTokens: usage.inputTokens,
        outputTokens: usage.outputTokens,
      },
    };
  }
);
