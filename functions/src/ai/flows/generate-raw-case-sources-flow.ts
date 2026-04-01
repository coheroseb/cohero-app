// @ts-nocheck
/**
 * @fileOverview AI flow to generate raw, unpolished sources for the Journal Trainer 2.0.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateRawCaseSourcesInputSchema = z.object({
  topic: z.string().describe('A specific area of social work to focus the dynamic case on (e.g., utsatte børn, misbrug).'),
  lawContext: z.string().describe('Relevant Danish law texts for context.')
});
export type GenerateRawCaseSourcesInput = z.infer<typeof GenerateRawCaseSourcesInputSchema>;

const SourceItemSchema = z.object({
  id: z.string().describe('Unique string ID for the source'),
  type: z.enum(['email', 'phone', 'note', 'sms', 'report']).describe('The kind of raw data source'),
  title: z.string().describe('A short descriptive title, e.g. "Mail fra skolelærer"'),
  sender: z.string().describe('Who sent or created this source, e.g. "Lærer Hans Jensen"'),
  date: z.string().describe('Relative date or time, e.g. "12. maj kl. 09:15"'),
  content: z.string().describe('The raw content. Make it sound authentic to the sender type (e.g. frustrated, fragmented, subjective). Put it in HTML paragraphs.'),
  reliability: z.enum(['høj', 'middel', 'lav']).describe('How reliable this source is (hidden from student, used for feedback)')
});
export type SourceItem = z.infer<typeof SourceItemSchema>;

const RawCaseSourcesDataSchema = z.object({
  caseNumber: z.string().describe('A fictional case number, e.g. "SAG-2024-88A"'),
  citizenName: z.string().describe('The name of the primary citizen in the case.'),
  citizenBirthday: z.string().describe('The birthdate of the citizen.'),
  title: z.string().describe('A concise title for the overall case envelope.'),
  description: z.string().describe('A very brief introductory context for the social worker opening this inbox.'),
  sources: z.array(SourceItemSchema).describe('An array of 3 to 4 raw sources belonging to this case.'),
  complexityHints: z.string().describe('Internal hints about what makes this case tricky (e.g. contradictory info). This is hidden from the student but passed to the feedback stage.')
});
export type RawCaseSourcesData = z.infer<typeof RawCaseSourcesDataSchema>;

const GenerateRawCaseSourcesOutputSchema = z.object({
  data: RawCaseSourcesDataSchema,
  usage: z.object({
    inputTokens: z.number(),
    outputTokens: z.number(),
  }),
});
export type GenerateRawCaseSourcesOutput = z.infer<typeof GenerateRawCaseSourcesOutputSchema>;

export async function generateRawCaseSources(input: GenerateRawCaseSourcesInput): Promise<GenerateRawCaseSourcesOutput> {
  return generateRawCaseSourcesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateRawCaseSourcesPrompt',
  input: { schema: GenerateRawCaseSourcesInputSchema },
  output: { schema: RawCaseSourcesDataSchema },
  prompt: `You are an expert social work supervisor in Denmark designing an advanced training simulation.
Instead of giving the student a neat, polished summary of a case, you will simulate a "messy inbox" containing 3-4 raw, unpolished sources.

The goal is to test the student's ability to:
1. Extract objective facts from subjective narratives.
2. Identify contradictions between sources.
3. Synthesize a professional journal entry.

The topic for this case is: {{{topic}}}.

You MUST ground the scenario in the legal and ethical context of the following Danish laws:
---
{{{lawContext}}}
---

Rules for generating the sources:
1. Generate exactly 3 or 4 distinct sources. Use diverse types ('email', 'phone', 'note', 'sms', 'report').
2. The senders should speak realistically—they are NOT social workers. A neighbor might be angry, a teacher might be over-extended, a parent might be defensive.
3. Include subtle contradictions. For example, a teacher says the child is "always tired", while the parent says "the child sleeps 10 hours".
4. The content should be in HTML paragraphs.
5. Provide a fictional 'caseNumber', 'citizenName', and 'citizenBirthday'.
6. 'complexityHints': Write a short summary of what the student should be looking for—what are the "traps" or key contradictions? (Hidden from student).
7. Output in Danish JSON.
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

const generateRawCaseSourcesFlow = ai.defineFlow(
  {
    name: 'generateRawCaseSourcesFlow',
    inputSchema: GenerateRawCaseSourcesInputSchema,
    outputSchema: GenerateRawCaseSourcesOutputSchema,
  },
  async (input) => {
    const { output, usage } = await prompt(input);
    return {
      data: output!,
      usage: {
        inputTokens: usage.inputTokens || 0,
        outputTokens: usage.outputTokens || 0
      }
    };
  }
);
