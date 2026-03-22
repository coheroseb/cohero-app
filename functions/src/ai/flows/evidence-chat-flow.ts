// @ts-nocheck
import { ai } from '@/ai/genkit';
import { 
    EvidenceChatInputSchema, 
    EvidenceChatDataSchema, 
    EvidenceChatOutputSchema, 
    type EvidenceChatInput, 
    type EvidenceChatOutput 
} from './types';

export async function chatWithEvidenceContent(input: EvidenceChatInput): Promise<EvidenceChatOutput> {
  return evidenceChatFlow(input);
}

const evidenceChatPrompt = ai.definePrompt({
  name: 'evidenceChatPrompt',
  input: { schema: EvidenceChatInputSchema },
  output: { schema: EvidenceChatDataSchema },
  prompt: `You are an expert academic assistant helping a student understand their empirical data.
Your task is to answer the user's question based primarily on the provided document text.

**Documents Context:**
{{#each documents}}
---
**Title:** {{this.title}}
**Content:**
{{{this.content}}}
---
{{/each}}

**Chat History:**
{{#if chatHistory}}
    {{#each chatHistory}}
    {{role}}: {{content}}
    {{/each}}
{{else}}
    No previous chat history.
{{/if}}

**User's Question:**
"{{{question}}}"

**Instructions:**
1. Answer the question pedagogically in Danish.
2. If the user's question asks for something clearly present in the document, quote relevant parts and explain them.
3. If the answer is not in the text, you can use your general knowledge but clearly state that the document does not mention it explicitly.
4. Structure your answer using HTML tags like \`<p>\`, \`<strong>\`, and \`<ul>/<li>\` to make it readable.
5. Provide 2-3 short suggested follow-up questions the user could ask to explore the document further.

Your response must be a single JSON object matching the requested schema.`,
  config: {
    temperature: 0.7,
    safetySettings: [
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_LOW_AND_ABOVE' },
    ],
  },
});

const evidenceChatFlow = ai.defineFlow(
  {
    name: 'evidenceChatFlow',
    inputSchema: EvidenceChatInputSchema,
    outputSchema: EvidenceChatOutputSchema,
  },
  async (input) => {
    const { output, usage } = await evidenceChatPrompt(input);
    if (!output) throw new Error("AI returned null output");
    return {
      data: output,
      usage: {
        inputTokens: usage?.inputTokens || 0,
        outputTokens: usage?.outputTokens || 0,
      },
    };
  }
);
