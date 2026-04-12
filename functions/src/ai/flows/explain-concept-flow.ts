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
  concept: z.string().describe('The social work concept to be explained.'),
  profession: z.string().optional().describe('The profession of the user (e.g., Socialrådgiver, Pædagog).'),
  books: z.array(BookSchemaForPrompt).optional().describe('A list of available textbooks with their metadata (TOC, index).'),
  lawContext: z.string().optional().describe('Deep legal context including guidelines for accurate paragraph explanation.'),
});


const prompt = ai.definePrompt({
  name: 'explainConceptPrompt',
  input: { schema: PromptInputSchema },
  output: { schema: ExplanationSchema },
  prompt: `The studerende wants to understand the concept: "{{{concept}}}"
{{#if profession}}
The user's profession is: "{{{profession}}}". 
You MUST tailor the explanation, practical examples (case), and relevance to reflect the specific practice, terminology, and challenges of a {{{profession}}}. 
For a "Pædagog", focus on the pedagogical environment (institutions, developmental work, relational coordination in a pedagogical context). 
For a "Socialrådgiver", focus on agency work, legal framework, and systemic case management.
{{/if}}

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

Your response must be a JSON object with the following keys, all in Danish. Use simple HTML tags like <h2>, <h3>, <ul>, <li>, and <strong> to structure the content for better readability.

1.  **definition**: Provide a thorough and pedagogical definition of the concept, suitable for a studerende. Break it down into its core components. The explanation should be detailed enough for a studerende to get a solid grasp of the concept. Use subheadings (e.g., <h3>) to structure the explanation.
2.  **etymology**: Forklar kort begrebets oprindelse og historiske kontekst. Hvorfor hedder det, som det gør? (f.eks. for "skøn" eller "selvbestemmelse").
3.  **relevance**: Explain why this concept is important and relevant for a social worker's daily practice. Structure this with bullet points (<ul> and <li>).
4.  **practicalExample**: Give a concrete, practice-oriented case example. Structure it with a brief **Situation**, a snippet of **Dialog/Observation**, and an **Analyse** that explains how the concept is applied.
5.  **legalAnchor**: Hvor finder vi dette begreb i lovgivningen? Angiv specifikke love eller paragraffer (f.eks. Barnets Lov, Serviceloven, Retssikkerhedsloven), hvor begrebet er centralt.
6.  **criticalReflection**: Tilføj en kritisk akademisk refleksion. Hvad er de etiske dilemmaer eller begrænsninger ved dette begreb i socialt arbejde?
7.  **suggestedLiterature**: Recommend 1-3 of the most relevant books.
    - **CRITICAL RULE 1: HIGH RELEVANCE.** Only recommend a book if its content is *highly* relevant to the concept "{{{concept}}}".
    - **CRITICAL RULE 2: USE PROVIDED SOURCES ONLY.** Your recommendations MUST come exclusively from the list of 'AVAILABLE BOOKS' provided.
8.  **relevantTheorists**: Identify key theorists related to '{{{concept}}}' based on the books provided.
9.  **relatedConcepts**: En liste over 3-4 relaterede begreber, som den studerende også bør kende til.
10. **socraticQuestion**: Stil ét udfordrende, sokratisk spørgsmål til den studerende, der får dem til at reflektere over begrebet i deres fremtidige praksis.
11. **isModel**: Identificer om der er tale om en specifik teoretisk model eller framework (f.eks. SMART, Gensvarsmodellen, SWOT, Maslows behovspyramide). Sæt denne til true, hvis begrebet har en fast struktur, der kan visualiseres.
12. **conceptModel**: Create a structured graph model of the concept. ONLY generate this if **isModel** is true.
    - **nodes**: Identify the 5-7 most critical "building blocks". Keep labels very short (max 2-3 words). Use Sentence Case.
    - **edges**: Define how these blocks connect. Use clear, short labels (e.g., "påvirker", "fører til", "kræver").
    - Layout the nodes in a logical conceptual flow (e.g. Initiator -> Action -> Result).
    - Make the model descriptive and pedagogical, ensuring it works as a clear mental map without visual clutter.
13. **legalContext**: If the concept is a law paragraph (e.g., "§ 42"), or if you have found highly relevant legal text in the 'LEGAL CONTEXT' above, you MUST populate this field with verbatim law text.

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
  model: 'googleai/gemini-2.5-flash',
});

const explainConceptFlow = ai.defineFlow(
  {
    name: 'explainConceptFlow',
    inputSchema: z.object({ concept: z.string(), profession: z.string().optional(), lawContext: z.string().optional() }),
    outputSchema: ExplainConceptOutputSchema,
  },
  async (input) => {
    const booksForPrompt = await getCachedBooks();
    
    let lawContext = input.lawContext || '';
    
    // Automatically fetch law context for all concepts to ensure academic and legal depth
    if (!lawContext) {
      console.log(`[EXPLAIN-CONCEPT] Fetching legal/academic context for: "${input.concept}"...`);
      lawContext = await getRelevantLawContext(input.concept);
    }

    const { output, usage } = await prompt({ concept: input.concept, profession: input.profession, books: booksForPrompt, lawContext });
    
    return {
      data: output!,
      usage: {
        inputTokens: usage.inputTokens,
        outputTokens: usage.outputTokens,
      },
    };
  }
);
