
/**
 * @fileOverview An AI flow to determine the consequence of a choice in a case dilemma.
 *
 * - getCaseConsequence - A function that returns the outcome of a studerende's choice.
 * - CaseConsequenceInput - The input type for the function.
 * - CaseConsequenceOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const CaseConsequenceInputSchema = z.object({
  scenario: z.string().describe("The case scenario text."),
  dilemma: z.string().describe("The specific dilemma the studerende faced."),
  chosenActionText: z.string().describe("The text of the action the studerende chose."),
});
export type CaseConsequenceInput = z.infer<typeof CaseConsequenceInputSchema>;

const ConsequenceDataSchema = z.object({
  consequence: z.string().describe("A pedagogical explanation of the immediate consequence of the chosen action. Must be in Danish and use simple HTML like <strong> and <ul> for formatting."),
  reflection: z.string().describe("A professional reflection on the trade-offs and underlying principles of the chosen action. Must be in Danish."),
});
export type ConsequenceData = z.infer<typeof ConsequenceDataSchema>;

const CaseConsequenceOutputSchema = z.object({
  data: ConsequenceDataSchema,
  usage: z.object({
    inputTokens: z.number(),
    outputTokens: z.number(),
  }),
});
export type CaseConsequenceOutput = z.infer<typeof CaseConsequenceOutputSchema>;


export async function getCaseConsequence(input: CaseConsequenceInput): Promise<CaseConsequenceOutput> {
  return caseConsequenceFlow(input);
}

const prompt = ai.definePrompt({
  name: 'caseConsequencePrompt',
  input: { schema: CaseConsequenceInputSchema },
  output: { schema: ConsequenceDataSchema },
  prompt: `You are an expert social work educator. A studerende is working through a case dilemma.
The scenario is: "{{{scenario}}}"
The dilemma was: "{{{dilemma}}}"
The studerende chose this action: "{{{chosenActionText}}}"

Your task is to provide a pedagogical response that explains the outcome of this specific choice. Your response should be in Danish and structured as a JSON object with two keys:

1.  **consequence**: Describe the immediate, realistic outcome of the chosen action. What happens next? Focus on the direct result of this single step.
2.  **reflection**: Provide a deeper professional reflection. What are the trade-offs of this choice? What professional value or legal principle does it prioritize (e.g., retssikkerhed, relationsdannelse, mindsteindgrebets princip)? What might be a critical perspective on this choice?

Keep your response focused and educational. It's not about "right" or "wrong", but about illuminating the professional considerations behind each action. Always use the term "borger" instead of "klient".
`,
  config: {
    safetySettings: [
      {
        category: 'HARM_CATEGORY_HATE_SPEECH',
        threshold: 'BLOCK_ONLY_HIGH',
      },
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_NONE',
      },
      {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
      {
        category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        threshold: 'BLOCK_LOW_AND_ABOVE',
      },
    ],
  },
});

const caseConsequenceFlow = ai.defineFlow(
  {
    name: 'caseConsequenceFlow',
    inputSchema: CaseConsequenceInputSchema,
    outputSchema: CaseConsequenceOutputSchema,
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
