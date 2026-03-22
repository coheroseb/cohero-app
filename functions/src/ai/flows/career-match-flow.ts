// @ts-nocheck

/**
 * @fileOverview An AI flow to match user values to social work specializations.
 * - getCareerMatch - Matches quiz answers to a career profile.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const CareerMatchInputSchema = z.object({
  answers: z.array(z.string()).describe("An array of the user's answers, e.g., ['jura', 'udvikling']."),
});
export type CareerMatchInput = z.infer<typeof CareerMatchInputSchema>;

const TopMatchSchema = z.object({
    name: z.string().describe("The name of the specialization."),
    description: z.string().describe("A short, inspiring description of why this area matches the user's values.")
});

const CareerMatchDataSchema = z.object({
  profileName: z.string().describe('A catchy name for the user\'s profile, e.g., "Den Retfærdige System-Navigator".'),
  profileDescription: z.string().describe('A one-sentence summary of the user\'s core motivation based on their answers.'),
  topMatches: z.array(TopMatchSchema).describe('An array of 2-3 social work specializations that fit the profile.'),
});

const CareerMatchOutputSchema = z.object({
  data: CareerMatchDataSchema,
  usage: z.object({
    inputTokens: z.number(),
    outputTokens: z.number(),
  }),
});
export type CareerMatchOutput = z.infer<typeof CareerMatchOutputSchema>;

export async function getCareerMatch(input: CareerMatchInput): Promise<CareerMatchOutput> {
    return careerMatchFlow(input);
}

const prompt = ai.definePrompt({
  name: 'careerMatchPrompt',
  input: { schema: CareerMatchInputSchema },
  output: { schema: CareerMatchDataSchema },
  prompt: `You are a career counselor for social work students in Denmark. A prospective student has answered a few questions about their values. Your task is to create an inspiring career profile based on their answers.

The user's answers were: {{{answers}}}

- If answers lean towards 'jura', the user values structure, rules, and rights. Matches could be: Beskæftigelsesområdet, Børne- og ungeforvaltning (myndighed).
- If answers lean towards 'udvikling', the user values personal growth, motivation, and resources. Matches could be: Misbrugsbehandling, Socialpsykiatri (udfører-delen).
- If answers lean towards 'tryghed', the user values safety, crisis intervention, and immediate care. Matches could be: Kvindekrisecenter, Børnehus, Hospitalssocialrådgiver.

Based on the combination of answers, perform these tasks in Danish:
1.  **Create a Profile Name:** Invent a creative, positive title for their profile (e.g., "Den Empatiske Brobygger", "Retfærdighedens Vogter").
2.  **Write a Profile Description:** Summarize their core motivation in one encouraging sentence.
3.  **Find Top Matches:** List 2-3 specific social work areas that fit their profile. For each, provide a short description explaining the match.

Your entire response MUST be a single JSON object.`,
});

const careerMatchFlow = ai.defineFlow(
  {
    name: 'careerMatchFlow',
    inputSchema: CareerMatchInputSchema,
    outputSchema: CareerMatchOutputSchema,
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
