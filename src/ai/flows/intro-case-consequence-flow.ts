
/**
 * @fileOverview An AI flow for a mini-case simulation for prospective students.
 * - getIntroCaseConsequence - Determines the consequence of a chosen action.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const IntroCaseConsequenceInputSchema = z.object({
  caseId: z.string().describe("The ID of the case, e.g., 'underretning-mia'."),
  actionId: z.enum(['A', 'B', 'C']).describe("The action chosen by the user."),
});
export type IntroCaseConsequenceInput = z.infer<typeof IntroCaseConsequenceInputSchema>;

const IntroCaseConsequenceDataSchema = z.object({
  consequence: z.string().describe("A pedagogical explanation of the immediate consequence of the chosen action."),
  nextStepSuggestion: z.string().describe("A forward-looking statement about what this teaches about social work."),
});

const IntroCaseConsequenceOutputSchema = z.object({
  data: IntroCaseConsequenceDataSchema,
  usage: z.object({
    inputTokens: z.number(),
    outputTokens: z.number(),
  }),
});
export type IntroCaseConsequenceOutput = z.infer<typeof IntroCaseConsequenceOutputSchema>;

export async function getIntroCaseConsequence(input: IntroCaseConsequenceInput): Promise<IntroCaseConsequenceOutput> {
    return introCaseConsequenceFlow(input);
}

const prompt = ai.definePrompt({
  name: 'introCaseConsequencePrompt',
  input: { schema: IntroCaseConsequenceInputSchema },
  output: { schema: IntroCaseConsequenceDataSchema },
  prompt: `You are a social work educator guiding a prospective social work student through their very first mini-case simulation. The goal is NOT to give a "right" or "wrong" answer, but to explain the professional dilemmas and trade-offs inherent in social work.

The case is 'underretning-mia'. The prospective student chose action '{{{actionId}}}'.

Based on the chosen action, provide a response in Danish with two parts: 'busted' (the myth itself) and 'reality' (the explanation).

*   If 'A' (Indkald straks til samtale): The consequence is you might escalate the situation and put the parents on the defensive, making alliance-building difficult. The dilemma is balancing the need for quick action with the need for collaboration.
*   If 'B' (Uanmeldt hjemmebesøg): The consequence is you risk a major breach of trust and a complaint, as it's a very invasive step. The dilemma is the state's right to intervene versus the family's right to privacy.
*   If 'C' (Ring først): The consequence is you create a respectful, collaborative starting point and build an alliance. The dilemma is that you might not get the "unfiltered" truth, but you prioritize partnership, which is central to the profession.

Your response must be a single JSON object.`,
});


const introCaseConsequenceFlow = ai.defineFlow(
  {
    name: 'introCaseConsequenceFlow',
    inputSchema: IntroCaseConsequenceInputSchema,
    outputSchema: IntroCaseConsequenceOutputSchema,
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
