
/**
 * @fileOverview An AI flow to generate realistic case scenarios for social work students.
 *
 * - generateCase - A function that creates a new case study.
 * - GenerateCaseInput - The input type for the generateCase function.
 * - GenerateCaseOutput - The return type for the generateCase function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const GenerateCaseInputSchema = z.object({
  topic: z.string().describe('A specific topic or area of social work to focus the case on (e.g., child neglect, substance abuse in a family, youth crime).'),
  lawContext: z.string().describe('A list of relevant laws for context.'),
});
export type GenerateCaseInput = z.infer<typeof GenerateCaseInputSchema>;

const ChoiceSchema = z.object({
    id: z.enum(['A', 'B', 'C']),
    text: z.string().describe("The text describing the action for this choice.")
});

const DilemmaSchema = z.object({
  dilemma: z.string().describe("The core professional dilemma the social work student must address at this step."),
  choices: z.array(ChoiceSchema).length(3).describe("An array of three distinct, plausible actions for this dilemma.")
});

const CaseDataSchema = z.object({
  title: z.string().describe('A concise title for the case study.'),
  topic: z.string().describe('The topic of the case study.'),
  scenario: z.string().describe('A detailed, realistic, and fictional scenario describing the situation. It should be written from the perspective of a social worker encountering the case. It must be in Danish and use HTML <p> tags for paragraph breaks.'),
  protagonists: z.array(z.string()).describe('A list of the key individuals involved in the case (e.g., "Mette, 34, mor", "Lars, 8, søn").'),
  initialObservation: z.string().describe('A brief, initial observation or report that kicks off the case, like a note from a teacher or a police report. It must be in Danish.'),
  dilemmas: z.array(DilemmaSchema).length(3).describe("An array of exactly 3 sequential dilemmas the social work student will face.")
});
export type CaseData = z.infer<typeof CaseDataSchema>;

const GenerateCaseOutputSchema = z.object({
  caseData: CaseDataSchema,
  usage: z.object({
      inputTokens: z.number(),
      outputTokens: z.number(),
  })
});
export type GenerateCaseOutput = z.infer<typeof GenerateCaseOutputSchema>;


export async function generateCase(input: GenerateCaseInput): Promise<GenerateCaseOutput> {
  return generateCaseFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateCasePrompt',
  input: { schema: GenerateCaseInputSchema },
  output: { schema: CaseDataSchema },
  prompt: `You are an expert social work supervisor in Denmark, tasked with creating a training case for a social work student.
The case must be fictional but highly realistic, grounded in the context of Danish social work and the provided legislation.
The topic for this case is: {{{topic}}}.

Your task is to generate a complete case scenario structured as a dilemma game for the studerende.

1.  **Generate Core Case:** Create a realistic scenario, protagonists, and an initial observation based on the topic. The scenario MUST be detailed and use multiple HTML <p> tags for readability. It MUST include the citizen's own perspective or stated goals.
2.  **Create 3 Sequential Dilemmas:** Create an array named \`dilemmas\` containing exactly 3 dilemma objects. Each object must represent a distinct step in handling the case and contain:
    *   A \`dilemma\` string: A clear, concise question the social work student must answer.
    *   A \`choices\` array with three distinct, plausible actions (A, B, C). Each choice should represent a different professional priority (e.g., legal security, relationship-building, intervention).

The dilemmas should represent a logical progression in a typical social work case based on the topic.
- The first dilemma should focus on the initial action.
- The second dilemma should focus on a follow-up action or information gathering.
- The third dilemma should focus on documentation or planning the next steps.

**CRITICAL:** All output must be in Danish.

You MUST ground the case in the legal and ethical context of the following Danish laws and guidelines:
---
{{{lawContext}}}
---
Use your general knowledge of these laws and general ethical principles to create a realistic scenario. For example, if the topic is 'Børn og unge', use concepts from Barnets Lov.

Your response must be a JSON object matching the output schema. The 'topic' field in your output should match the input topic: "{{{topic}}}".
Always use the term "borger" instead of "klient" in the scenario and dilemmas.
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

const generateCaseFlow = ai.defineFlow(
  {
    name: 'generateCaseFlow',
    inputSchema: GenerateCaseInputSchema,
    outputSchema: GenerateCaseOutputSchema,
  },
  async (input) => {
    const { output, usage } = await prompt(input);
    return {
      caseData: output!,
      usage: {
        inputTokens: usage.inputTokens,
        outputTokens: usage.outputTokens
      }
    };
  }
);
