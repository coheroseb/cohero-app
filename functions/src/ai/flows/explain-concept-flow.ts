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
    UsageSchema,
} from './types';
import { getCachedBooks } from './book-cache';
import { getRelevantLawContext } from '../../lib/law-context-helper';


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
  concept: z.string().describe('The concept, question, or topic to be explained/answered.'),
  profession: z.string().optional().describe('The profession of the user.'),
  books: z.array(BookSchemaForPrompt).optional().describe('Relevant curriculum books for context.'),
  lawContext: z.string().optional().describe('Deep legal context from the Law Portal.'),
});


const prompt = ai.definePrompt({
  name: 'explainConceptPrompt',
  input: { schema: PromptInputSchema },
  output: { schema: ExplanationSchema },
  prompt: `The studerende has the following query/topic: "{{{concept}}}"

{{#if profession}}
The user's profession is: "{{{profession}}}". 
Tailor the response to reflect the specific practice and challenges of a {{{profession}}}.
{{/if}}

{{#if lawContext}}
**LEGAL CONTEXT (LOVPORTALENS SAMLING):**
---
{{{lawContext}}}
---
**IMPORTANT:** Use this as your ONLY source for legal facts. No guessing.
{{/if}}

{{#if books}}
**LITERATURE CONTEXT (TEORETISK GRUNDLAG):**
---
{{#each books}}
- Title: {{{this.title}}}, Author: {{{this.author}}}, Content Info: {{{this.RAG}}}
{{/each}}
---
{{/if}}

Your task is to provide a comprehensive, pedagogical response. If the query is a full sentence or a multi-part topic (e.g., "individualisering som samfundsdynamik"), you must synthesize an answer that covers all facets.

Your response must be a JSON object with the following keys, all in Danish.

1.  **definition**: Provide a thorough definition or exploration of the primary theme. If the query is a question, answer it pedogogically here. Break it down into core components using subheadings (e.g., <h3>).
2.  **etymology**: Begrebets eller fænomenets oprindelse og historiske kontekst.
3.  **relevance**: Why is this theme/question important for a social worker? Use <ul> and <li>.
4.  **practicalExample**: A concrete case example. Structure with **Situation**, **Dialog**, and **Analyse**.
5.  **legalAnchor**: Hvor finder vi hjemmel eller juridisk relevans i Lovportalens samling (ovenfor)?
6.  **criticalReflection**: En kritisk akademisk refleksion over temaet/spørgsmålet (f.eks. etiske dilemmaer).
7.  **suggestedLiterature**: Recommend 1-3 relevant books ONLY from the provided list.
8.  **relevantTheorists**: Key theorists related to this topic based on the books.
9.  **relatedConcepts**: 3-4 relaterede begreber eller temaer.
10. **socraticQuestion**: Stil ét udfordrende, sokratisk spørgsmål til refleksion.
11. **isModel**: True if the topic can be visualized as a model/framework.
12. **conceptModel**: A structured graph model if isModel is true.
13. **legalContext**: Indsæt ordret lovtekst fra Lovportalens samling (ovenfor) hvis relevant.
14. **disambiguation**: If the query is broad or could be explored from different angles (e.g. "individualisering" could be sociological, legal, or practice-oriented), provide 3-4 specific "angles" here. Each angle must have a **title**, a brief **description** of that angle, and a refined **query** for that specific angle. If the query is already specific, leave this empty.

Always use "borger" instead of "klient".
`,
  config: {
    safetySettings: [
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_LOW_AND_ABOVE' },
    ],
  },
  model: 'googleai/gemini-2.5-flash',
});

const explainConceptFlow = ai.defineFlow(
  {
    name: 'explainConceptFlow',
    inputSchema: z.object({ concept: z.string(), profession: z.string().optional(), lawContext: z.string().optional() }),
    outputSchema: ExplainConceptOutputSchema,
  },
  async (input) => {
    // 1. Fetch all books
    const allBooks = await getCachedBooks();
    
    // 2. Filter books by relevance to the query (simple keyword check for efficiency)
    const keywords = input.concept.toLowerCase().split(/\s+/);
    const relevantBooks = allBooks.filter(book => {
        const bookText = `${book.title} ${book.author} ${book.RAG}`.toLowerCase();
        return keywords.some(kw => kw.length > 3 && bookText.includes(kw));
    }).slice(0, 8); // Top 8 relative books to keep context clean
    
    // Fallback: If no matches, send top 3 general books
    const booksForPrompt = relevantBooks.length > 0 ? relevantBooks : allBooks.slice(0, 3);
    
    let lawContext = input.lawContext || '';
    
    // 3. Fetch law context
    if (!lawContext) {
      console.log(`[EXPLAIN-CONCEPT] Fetching context for semantic query: "${input.concept}"...`);
      lawContext = await getRelevantLawContext(input.concept);
    }

    const { output, usage } = await prompt({ 
        concept: input.concept, 
        profession: input.profession, 
        books: booksForPrompt, 
        lawContext 
    });
    
    return {
      data: output!,
      usage: {
        inputTokens: usage.inputTokens,
        outputTokens: usage.outputTokens,
      },
    };
  }
);
