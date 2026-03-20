
'use server';
// src/ai/flows/content-recommendations.ts

/**
 * @fileOverview A content recommendation AI agent.
 *
 * - recommendContent - A function that handles the content recommendation process.
 * - RecommendContentInput - The input type for the recommendContent function.
 * - RecommendContentOutput - The return type for the recommendContent function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const RecommendContentInputSchema = z.object({
  userInteractions: z
    .string()
    .describe(
      'A string containing the history of user interactions, including likes, shares, and viewing history. Each interaction should be separated by a comma.'
    ),
});
export type RecommendContentInput = z.infer<typeof RecommendContentInputSchema>;

const RecommendedContentSchema = z.object({
  title: z.string().describe('The title of the recommended content.'),
  description: z.string().describe('A brief description of the recommended content.'),
  url: z.string().describe('The URL of the recommended content.'),
});

const RecommendationsSchema = z.array(RecommendedContentSchema).describe(
  'An array of recommended content, each including a title, description, and URL.'
);

const RecommendContentOutputSchema = z.object({
  data: RecommendationsSchema,
  usage: z.object({
      inputTokens: z.number(),
      outputTokens: z.number(),
  })
});

export type RecommendContentOutput = z.infer<typeof RecommendContentOutputSchema>;

export async function recommendContent(input: RecommendContentInput): Promise<RecommendContentOutput> {
  return recommendContentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'recommendContentPrompt',
  input: {schema: RecommendContentInputSchema},
  output: {schema: RecommendationsSchema},
  prompt: `You are an AI content recommendation system for Danish social work students. Based on the user's past interactions, recommend content that they might be interested in.

  **IMPORTANT:** All titles and descriptions MUST be in Danish.

  User Interactions: {{{userInteractions}}}

  Consider the user's likes, shares, and viewing history to determine their interests. Provide an array of recommended content, including the title, a brief description, and the URL for each item.

  Format your response as a JSON array of objects:
  [
    {
      "title": "Titel på anbefalet indhold",
      "description": "Kort beskrivelse af indholdet på dansk",
      "url": "URL til indholdet"
    },
    ...
  ]`,config: {
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

const recommendContentFlow = ai.defineFlow(
  {
    name: 'recommendContentFlow',
    inputSchema: RecommendContentInputSchema,
    outputSchema: RecommendContentOutputSchema,
  },
  async input => {
    const {output, usage} = await prompt(input);
    return {
      data: output!,
      usage: {
        inputTokens: usage.inputTokens,
        outputTokens: usage.outputTokens
      }
    };
  }
);
