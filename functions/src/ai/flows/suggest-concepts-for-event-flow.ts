// @ts-nocheck


/**
 * @fileOverview An AI flow to suggest preparation concepts for a calendar event.
 * - suggestConceptsForEvent - Analyzes an event and suggests key concepts.
 */
import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import {
    SuggestConceptsForEventInputSchema,
    SuggestConceptsForEventDataSchema,
    SuggestConceptsForEventOutputSchema,
    type SuggestConceptsForEventInput,
    type SuggestConceptsForEventOutput
} from './types';
import { getCachedBooks } from './book-cache';

const BookSchemaForPrompt = z.object({
  title: z.string(),
  author: z.string(),
  RAG: z.string().optional(),
});

const PromptInputSchema = SuggestConceptsForEventInputSchema.extend({
  books: z.array(BookSchemaForPrompt).optional(),
});

export async function suggestConceptsForEvent(input: SuggestConceptsForEventInput): Promise<SuggestConceptsForEventOutput> {
  return suggestConceptsForEventFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestConceptsForEventPrompt',
  input: { schema: PromptInputSchema },
  output: { schema: SuggestConceptsForEventDataSchema },
  prompt: `You are an expert social work tutor in Denmark. A student has the following event in their calendar:

  Title: "{{{summary}}}"
  Description: "{{{description}}}"

  Here is a list of available curriculum books with their content information (keywords, topics, etc.):
  ---
  AVAILABLE BOOKS:
  {{#each books}}
  - Title: {{{this.title}}}, Author: {{{this.author}}}, Content Info: {{{this.RAG}}}
  {{/each}}
  ---

  Based on the event's title and description, and cross-referencing with the content information from the available books, identify 2-4 key social work concepts, theories, or specific laws (e.g., "Barnets Lov § 32") that would be most relevant for the student to review in preparation.

  **CRITICAL:** Your suggestions must be directly inspired by the book content information provided. Find keywords in the event description and match them to keywords in the book's 'Content Info'.
  
  **IMPORTANT:** Your response MUST be in Danish.

  Your response should be a JSON object with a single key "concepts" containing an array of strings. The concepts should be concise and directly useful.
  `,
});

const suggestConceptsForEventFlow = ai.defineFlow(
  {
    name: 'suggestConceptsForEventFlow',
    inputSchema: SuggestConceptsForEventInputSchema,
    outputSchema: SuggestConceptsForEventOutputSchema,
  },
  async (input) => {
    const booksForPrompt = await getCachedBooks();
    
    const { output, usage } = await prompt({ ...input, books: booksForPrompt });
    return {
      data: output!,
      usage: {
        inputTokens: usage.inputTokens,
        outputTokens: usage.outputTokens
      }
    };
  }
);
