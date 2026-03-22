// @ts-nocheck

'use server';
/**
 * @fileOverview An AI flow to facilitate Socratic reflection on a social work student's practice experience.
 *
 * - getSocraticReflection - Generates reflective questions and identifies key terminology based on a user's input.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { SocraticInputSchema, SocraticDataSchema, SocraticOutputSchema, type SocraticInput, type SocraticOutput } from '@/ai/flows/types';

const BookSchemaForPrompt = z.object({
  title: z.string(),
  author: z.string(),
  RAG: z.string().optional(),
});

const SocraticPromptInputSchema = z.object({
  reflectionText: z.string().describe("The user's reflection text."),
  books: z.array(BookSchemaForPrompt).optional().describe('A list of available textbooks.'),
  ethicsContext: z.string().optional().describe('The professional ethics guidelines.'),
});


export async function getSocraticReflection(input: SocraticInput): Promise<SocraticOutput> {
  return socraticFlow(input);
}

const prompt = ai.definePrompt({
  name: 'socraticReflectionPrompt',
  input: { schema: SocraticPromptInputSchema },
  output: { schema: SocraticDataSchema },
  prompt: `You are an experienced social work supervisor and mentor for a Danish social work student. A social work student has shared this reflection from their daily life or internship: "{{{reflectionText}}}".
  
  Your response MUST be grounded in the following ethical guidelines from the Danish Association of Social Workers:
  ---
  {{{ethicsContext}}}
  ---

  {{#if books}}
  Here is a list of available curriculum books. Use this list as the ONLY source for literature references.
  ---
  AVAILABLE BOOKS:
  {{#each books}}
  - Title: {{{this.title}}}, Author: {{{this.author}}}, Content Info: {{{this.RAG}}}
  {{/each}}
  ---
  {{/if}}

  Your task is NOT to provide solutions.
  1. Ask 3-4 deep, Socratic questions that help the social work student understand their role, ethics, power, and professional identity, with direct reference to the provided ethical guidelines.
  2. Identify 2-3 professional concepts (e.g., "Moralsk stress", "Fagligt skøn") relevant to the reflection.
  3. For each concept, search the AVAILABLE BOOKS list. When searching for the concept, also consider related grammatical forms (e.g., for "magt", also search for "magtanvendelse"). If you find a book that clearly discusses the concept (check title, author, and Content Info), add a "source" object with the "bookTitle" and, if possible, the specific "chapter" or page number (sidetal). DO NOT invent sources.
  
  All output must be in Danish.
  Always use the term "borger" instead of "klient".
  Return a JSON object with the format: { "questions": [...], "terminology": [{"term": "...", "description": "...", "source": {"bookTitle": "...", "chapter": "..."}}] }`,
});

const socraticFlow = ai.defineFlow(
  {
    name: 'socraticFlow',
    inputSchema: SocraticInputSchema,
    outputSchema: SocraticOutputSchema,
  },
  async (input) => {
    // Extract the last user message from the history to pass to the prompt
    const lastMessageContent = input.history[input.history.length - 1]?.content || '';
    
    const { output, usage } = await prompt({
      reflectionText: lastMessageContent,
      books: input.books,
      ethicsContext: input.ethicsContext,
    });
    
    return {
        data: output!,
        usage: {
            inputTokens: usage.inputTokens,
            outputTokens: usage.outputTokens
        }
    };
  }
);
