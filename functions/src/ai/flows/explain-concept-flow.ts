// @ts-nocheck


/**
 * @fileOverview An AI flow to explain social work concepts.
 * - explainConcept - Generates a studerende-oriented explanation of a concept.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { 
    ExplanationSchema,
    ExplainConceptOutputSchema, 
    type ExplainConceptInput,
    type ExplainConceptOutput,
} from './types';
import { getCachedBooks } from './book-cache';


const BookSchemaForPrompt = z.object({
  title: z.string(),
  author: z.string(),
  year: z.string().optional(),  
  RAG: z.string().optional().describe('Relevant content excerpts, keywords, and topics from the book for retrieval-augmented generation.'),
});


export async function explainConcept(input: ExplainConceptInput): Promise<ExplainConceptOutput> {
  return explainConceptFlow(input);
}

const PromptInputSchema = z.object({
  concept: z.string().describe('The social work concept to be explained.'),
  books: z.array(BookSchemaForPrompt).optional().describe('A list of available textbooks with their metadata (TOC, index).'),
  lawContext: z.string().optional().describe('Deep legal context including guidelines for accurate paragraph explanation.'),
});


const prompt = ai.definePrompt({
  name: 'explainConceptPrompt',
  input: { schema: PromptInputSchema },
  output: { schema: ExplanationSchema },
  prompt: `You are an expert social work lexicon, providing clear and practice-oriented explanations for Danish social work students.

The studerende wants to understand the concept: "{{{concept}}}"

{{#if lawContext}}
**LEGAL CONTEXT (Use this for accurate paragraph explanations):**
---
{{{lawContext}}}
---
{{/if}}

{{#if books}}
Here is a list of available curriculum books. You MUST use this list as the primary source for literature recommendations.
---
AVAILABLE BOOKS:
{{#each books}}
- Title: {{{this.title}}}, Author: {{{this.author}}}, Content Info: {{{this.RAG}}}
{{/each}}
---
{{/if}}

Your response must be a JSON object with five keys, all in Danish. Use simple HTML tags like <h2>, <h3>, <ul>, <li>, and <strong> to structure the content for better readability.

1.  **definition**: Provide a thorough and pedagogical definition of the concept, suitable for a studerende. If the concept is a law paragraph (e.g. "§ 32"), use the provided 'LEGAL CONTEXT' (especially any associated guidelines) to explain it accurately. Break it down into its core components and use examples where appropriate. The explanation should be detailed enough for a studerende to get a solid grasp of the concept. Use subheadings (e.g., <h3>) to structure the explanation.
2.  **relevance**: Explain why this concept is important and relevant for a social worker's daily practice. Structure this with bullet points (<ul> and <li>).
3.  **example**: Give a short, concrete, and fictional example of how the concept might appear or be used in a social work case. The example must be highly practice-oriented. Structure it with a brief **Situation**, followed by a snippet of **Dialog** or an **Observation**, and finally an **Analyse** that explicitly explains how the concept is demonstrated.
4.  **suggestedLiterature**: Recommend 1-3 of the most relevant books.
    - **CRITICAL RULE 1: HIGH RELEVANCE.** Only recommend a book if its content is *highly* relevant to the concept "{{{concept}}}". Do not recommend a book just to fill the list.
    - **CRITICAL RULE 2: NO DUPLICATES.** Each book should appear only once in the final list.
    - **CRITICAL RULE 3: USE PROVIDED SOURCES ONLY.** Your recommendations MUST come exclusively from the list of 'AVAILABLE BOOKS' provided. Do not invent sources.
    - **PROCESS:**
        1.  Carefully search the 'title', 'author', and 'Content Info' of the AVAILABLE BOOKS for "{{{concept}}}" and its grammatical variations (e.g., "magt" -> "magtanvendelse").
        2.  For each highly relevant book you identify, create a single object.
        3.  In the \`relevance\` field, write a short, sharp summary of why the book as a whole is relevant.
        4.  In the \`chapters\` field, create an array of strings listing ALL specific chapter titles from that book's metadata that are relevant to the concept. If no specific chapters stand out but the book is still relevant, you can omit the \`chapters\` field.
        5.  If no relevant books are found in the list, you MUST return an empty array for this field.
5.  **relevantTheorists**: Identify key theorists related to '{{{concept}}}'.
    - **CRITICAL RULE:** Your answer MUST be based exclusively on the 'AVAILABLE BOOKS' list. Do not name any theorist whose name does not appear in the provided book metadata.
    - **PROCESS:**
        1. Search for theorists' names within the metadata of the provided books.
        2. Filter this list to include only theorists clearly linked to the concept '{{{concept}}}' and its variations (e.g., for "Anerkendelse", also consider "anerkendende tilgange").
        3. For each theorist found, provide their 'name', 'era' (e.g., 'ca. 1950'), a brief 'contribution' summary, and a 'source' object with the 'bookTitle' and, if possible, the 'chapter'.
        4. If no theorists are found in the book list for this concept, return an empty array for this field.

Always use the term "borger" instead of "klient" in your explanations and examples.
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

const explainConceptFlow = ai.defineFlow(
  {
    name: 'explainConceptFlow',
    inputSchema: z.object({ concept: z.string(), lawContext: z.string().optional() }),
    outputSchema: ExplainConceptOutputSchema,
  },
  async (input) => {
    const booksForPrompt = await getCachedBooks();

    const { output, usage } = await prompt({ concept: input.concept, books: booksForPrompt, lawContext: input.lawContext });
    
    return {
      data: output!,
      usage: {
        inputTokens: usage.inputTokens,
        outputTokens: usage.outputTokens,
      },
    };
  }
);
