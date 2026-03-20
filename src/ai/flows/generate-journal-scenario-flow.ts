'use server';
/**
 * @fileOverview An AI flow to generate realistic scenarios for the Journal Trainer.
 *
 * - generateJournalScenario - Creates a new scenario for a student to write about.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const GenerateJournalScenarioInputSchema = z.object({
  topic: z.string().describe('A specific topic or area of social work to focus the case on (e.g., child neglect, substance abuse).'),
  lawContext: z.string().describe('Relevant Danish law texts for context.')
});
export type GenerateJournalScenarioInput = z.infer<typeof GenerateJournalScenarioInputSchema>;

const JournalScenarioDataSchema = z.object({
  title: z.string().describe('A concise title for the scenario.'),
  scenario: z.string().describe('A detailed, realistic, and fictional scenario describing the situation. It must be in Danish and use HTML <p> tags for paragraph breaks.'),
  initialObservation: z.string().describe('A brief, initial observation or report that kicks off the case, like a note from a teacher or a police report. It must be in Danish.'),
});
export type JournalScenarioData = z.infer<typeof JournalScenarioDataSchema>;

const GenerateJournalScenarioOutputSchema = z.object({
  data: JournalScenarioDataSchema,
  usage: z.object({
    inputTokens: z.number(),
    outputTokens: z.number(),
  }),
});
export type GenerateJournalScenarioOutput = z.infer<typeof GenerateJournalScenarioOutputSchema>;

export async function generateJournalScenario(input: GenerateJournalScenarioInput): Promise<GenerateJournalScenarioOutput> {
  return generateJournalScenarioFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateJournalScenarioPrompt',
  input: { schema: GenerateJournalScenarioInputSchema },
  output: { schema: JournalScenarioDataSchema },
  prompt: `You are an expert social work supervisor in Denmark. Your task is to create a realistic scenario for a social work student to practice writing a journal entry.
The scenario must be fictional but grounded in the context of Danish social work and the provided legislation.

The topic for this scenario is: {{{topic}}}.

You MUST ground the scenario in the legal and ethical context of the following Danish laws:
---
{{{lawContext}}}
---

Your task is to generate the following, all in Danish:

1.  **title**: A short, descriptive title for the scenario (e.g., "Underretning vedr. 8-årig dreng").
2.  **scenario**: A detailed description of the situation. This should be a few paragraphs long, use HTML \`<p>\` tags for separation, and give the student enough information to write a meaningful journal entry. It should set a scene and describe what has happened.
3.  **initialObservation**: A very brief, one-sentence summary that acts as the trigger for the social worker's involvement (e.g., "Skolen har ringet med en bekymring for en elevs trivsel.").

Your response MUST be a single JSON object.
Always use the term "borger" instead of "klient".
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

const generateJournalScenarioFlow = ai.defineFlow(
  {
    name: 'generateJournalScenarioFlow',
    inputSchema: GenerateJournalScenarioInputSchema,
    outputSchema: GenerateJournalScenarioOutputSchema,
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
