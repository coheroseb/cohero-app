// @ts-nocheck

/**
 * @fileOverview An AI flow to recommend study techniques.
 * - recommendTechnique - Recommends techniques based on a user's challenge.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const TechniqueSchema = z.object({
  id: z.string(),
  title: z.string(),
  content: z.string(),
});

const RecommendTechniqueInputSchema = z.object({
  challenge: z.string().describe("The social work student's study-related challenge."),
  techniques: z.array(TechniqueSchema).describe('A list of available study techniques with their content.'),
});
export type RecommendTechniqueInput = z.infer<typeof RecommendTechniqueInputSchema>;

const RecommendedTechniqueSchema = z.object({
    id: z.string().describe('The ID of the recommended technique.'),
    quote: z.string().describe("A short, specific quote from the technique's content that is most relevant to the user's challenge."),
});

const RecommendTechniqueDataSchema = z.object({
  recommendations: z.array(RecommendedTechniqueSchema).describe('An array of recommended techniques, each with an ID and a relevant quote.'),
});

const RecommendTechniqueOutputSchema = z.object({
  data: RecommendTechniqueDataSchema,
  usage: z.object({
    inputTokens: z.number(),
    outputTokens: z.number(),
  }),
});
export type RecommendTechniqueOutput = z.infer<typeof RecommendTechniqueOutputSchema>;

export async function recommendTechnique(input: RecommendTechniqueInput): Promise<RecommendTechniqueOutput> {
  return recommendTechniqueFlow(input);
}

const prompt = ai.definePrompt({
  name: 'recommendTechniquePrompt',
  input: { schema: RecommendTechniqueInputSchema },
  output: { schema: RecommendTechniqueDataSchema },
  prompt: `You are an expert academic advisor for social work students in Denmark.
A social work student is facing a challenge and needs advice on which study technique to use.

The social work student's challenge is: "{{{challenge}}}"

Here is a list of available techniques with their content:
{{#each techniques}}
---
ID: {{id}}
Title: "{{title}}"
Content: "{{{content}}}"
---
{{/each}}

Based on the social work student's challenge, identify the 1-3 most relevant techniques. For each recommendation, you MUST provide a short, direct quote from its content that specifically addresses the social work student's problem.

Your response MUST be a JSON object containing an array of recommendations, where each recommendation has an 'id' and a 'quote'.
Example: \`{"recommendations": [{"id": "tech-1", "quote": "Start med at scanne indholdsfortegnelsen og konklusionen for at få et overblik."}]}\`
`,
});

const recommendTechniqueFlow = ai.defineFlow(
  {
    name: 'recommendTechniqueFlow',
    inputSchema: RecommendTechniqueInputSchema,
    outputSchema: RecommendTechniqueOutputSchema,
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
