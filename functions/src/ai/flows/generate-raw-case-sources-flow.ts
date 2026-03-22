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
  type: z.enum(['email', 'phone', 'note', 'sms']).describe('The kind of raw data source'),
  title: z.string().describe('A short descriptive title, e.g. "Mail fra skolelærer"'),
  sender: z.string().describe('Who sent or created this source, e.g. "Lærer Hans Jensen"'),
  date: z.string().describe('Relative date or time, e.g. "12. maj kl. 09:15"'),
  content: z.string().describe('The raw content. Make it sound authentic to the sender type (e.g. frustrated, fragmented, subjective). Put it in HTML paragraphs.')
});
export type SourceItem = z.infer<typeof SourceItemSchema>;

const RawCaseSourcesDataSchema = z.object({
  title: z.string().describe('A concise title for the overall case envelope.'),
  description: z.string().describe('A very brief introductory context for the social worker opening this inbox.'),
  sources: z.array(SourceItemSchema).describe('An array of 2 to 3 raw sources belonging to this case.')
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
Instead of giving the student a neat, polished summary of a case, you will simulate a "messy inbox" containing 2-3 raw, unpolished sources (e.g., an email from an angry neighbor, an unstructured phone transcript from a school teacher, or a colleague's very brief Post-It note).
The social work student will have to read these sources, extract the objective facts, and write a professional journal entry.

The topic for this case is: {{{topic}}}.

You MUST ground the scenario in the legal and ethical context of the following Danish laws:
---
{{{lawContext}}}
---

Rules for generating the sources:
1. Generate exactly 2 or 3 distinct sources of different types ('email', 'phone', 'note', 'sms').
2. The senders should speak realistically—they are NOT social workers writing journals. They may use subjective language ("han var vildt urimelig", "hun er en dårlig mor").
3. Include enough concrete, objective facts mixed with subjective feelings so the student has material to synthesize.
4. Always use the term "borger" internally, but external senders (like a teacher) might just use the person's name or relationship.
5. Provide a short case title and brief description to set the scene (e.g., "Ny underretning i indbakken").
6. Output in Danish JSON.
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
