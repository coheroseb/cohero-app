
'use server';
/**
 * @fileOverview An AI flow to generate quizzes on user-specified topics.
 *
 * - generateQuiz - Generates a multiple-choice quiz.
 * - QuizGeneratorInput - The input type.
 * - QuizGeneratorOutput - The return type.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import {
  QuizGeneratorInputSchema,
  QuizDataSchema,
  QuizGeneratorOutputSchema,
  type QuizGeneratorInput,
  type QuizGeneratorOutput,
} from './types';


export async function generateQuiz(input: QuizGeneratorInput): Promise<QuizGeneratorOutput> {
  return quizGeneratorFlow(input);
}

const prompt = ai.definePrompt({
  name: 'quizGeneratorPrompt',
  input: { schema: QuizGeneratorInputSchema },
  output: { schema: QuizDataSchema },
  prompt: `You are an expert educator in social work in Denmark, skilled at creating challenging test questions. Your task is to create a multiple-choice quiz for a social work student designed to test deep understanding, not just surface-level knowledge.

The quiz topic is: "{{{topic}}}"
Number of questions: {{{numQuestions}}}

{{#if contextText}}
**IMPORTANT:** You MUST base your questions, answers, and explanations exclusively on the provided context text below.
**Context:**
---
{{{contextText}}}
---
{{else if lawContext}}
**VIGTIG INSTRUKS VEDRØRENDE EKSTERN URL KONTEKST:**
Den medsendte tekststreng (\`lawContext\`) indledes med en sektion kaldet "EXTERNAL URL CONTEXT". 
**DU SKAL bruge disse URL'er som dit primære kildegrundlag.** Betragt disse links som de autoritative kilder for de spørgsmål, du genererer. Du bør søge at hente og analysere indholdet fra disse links for at sikre, at quizzen er 100% retvisende i forhold til den nyeste administrative praksis.

I dine forklaringer bør du eksplicit henvise til, om informationen stammer fra hovedloven eller en specifik vejledning (ved navn og evt. link), så den studerende kan se forbindelsen til de officielle kilder.

**Juridisk Kontekst (inklusive URL-links):**
---
{{{lawContext}}}
---
{{else}}
**IMPORTANT:** No specific context was provided. You must rely SOLELY on your general professional knowledge to generate this quiz. DO NOT invent legal details or reference specific paragraphs you do not have the text for.
{{/if}}

For each question, you MUST:
1.  Create a clear and relevant question about the topic.
2.  Provide exactly four answer options.
3.  **Crucially, the three incorrect options (distractors) must be challenging.** They should represent common misunderstandings, be "nearly correct," or address related but distinct concepts. Avoid obviously wrong answers.
4.  The position of the correct answer within the \`options\` array MUST be randomized for each question. Do not always place it at the same index.
5.  Identify the index (0-3) of the correct answer in \`correctOptionIndex\`.
6.  Write a brief, pedagogical explanation for why the correct answer is right and, if relevant, why the distractors are wrong.

All output must be in Danish.
Your response MUST be a JSON object containing an array of question objects.
`,
  config: {
    temperature: 0.7,
     safetySettings: [
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_LOW_AND_ABOVE' },
    ],
  }
});

const quizGeneratorFlow = ai.defineFlow(
  {
    name: 'quizGeneratorFlow',
    inputSchema: QuizGeneratorInputSchema,
    outputSchema: QuizGeneratorOutputSchema,
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
