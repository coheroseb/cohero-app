
/**
 * @fileOverview An AI flow to create a "Practice Guide" by connecting user reflections to curriculum.
 *
 * - getFagligtMycelium - Analyzes user text and connects it to relevant theories and laws.
 * - FagligtMyceliumInput - The input type for the function.
 * - FagligtMyceliumOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { 
    FagligtMyceliumInputSchema, 
    PracticeGuideSchema, 
    FagligtMyceliumOutputSchema, 
    type FagligtMyceliumInput, 
    type FagligtMyceliumOutput 
} from './types';


export async function getFagligtMycelium(input: FagligtMyceliumInput): Promise<FagligtMyceliumOutput> {
  return fagligtMyceliumFlow(input);
}

const prompt = ai.definePrompt({
  name: 'fagligtMyceliumPrompt',
  input: { schema: FagligtMyceliumInputSchema },
  output: { schema: PracticeGuideSchema },
  prompt: `You are a "Fagligt Mycelium", an AI expert in Danish social work, tasked with finding the hidden theoretical and legal connections in a social work student's text.

Your task is to analyze the social work student's text and connect it to the provided curriculum books, laws, and ethical guidelines.

**Social work student's Text:**
---
{{{userText}}}
---

**Available Curriculum Books:**
{{#if books}}
{{#each books}}
- Title: {{{this.title}}}, Author: {{{this.author}}}, Content Info: {{{this.RAG}}}
{{/each}}
{{/if}}
---

**Relevant Law Context:**
---
{{{lawContext}}}
---

**Ethical Guidelines Context:**
---
{{{ethicsContext}}}
---

**Instructions:**

1.  **Generate a Title:** Create a short, descriptive title for this analysis.
2.  **Identify Connections:**
    *   Read the social work student's text carefully.
    *   Identify 3-5 key sentences or short phrases that touch upon a professional concept, a legal principle, or an ethical dilemma.
    *   For each identified phrase (\`sourceText\`), create a "connection" object.
    *   This object must contain:
        *   \`sourceText\`: The *exact* phrase from the social work student's text.
        *   \`concept\`: The name of the professional term or legal principle (e.g., "Magtanvendelse", "Partshøring", "Anerkendende pædagogik").
        *   \`explanation\`: A brief explanation of how the source text relates to the identified concept.
        *   \`bookReference\`: **CRITICAL:** Search ONLY the 'AVAILABLE BOOKS' list. When searching for the identified \`concept\`, also consider related terms (e.g., if the concept is "Anerkendelse", also search for "anerkendende"). If you find a book that clearly discusses the concept (check title, author, and Content Info), state its title and, if possible, the chapter or page number from the book's metadata. If no match is found in the list, you MUST omit this field. Do not invent sources.
3.  **Create Reflection Questions:** Based on your analysis, formulate 2-3 open-ended, Socratic questions that encourage the social work student to reflect deeper on the connections you've found.

Your entire response MUST be a JSON object that strictly follows the output schema. All text must be in Danish.
`,
});

const fagligtMyceliumFlow = ai.defineFlow(
  {
    name: 'fagligtMyceliumFlow',
    inputSchema: FagligtMyceliumInputSchema,
    outputSchema: FagligtMyceliumOutputSchema,
  },
  async (input) => {
    const { output, usage } = await prompt(input);
    return {
      data: output!,
      usage: {
        inputTokens: usage.inputTokens,
        outputTokens: usage.outputTokens
      }
    };
  }
);
