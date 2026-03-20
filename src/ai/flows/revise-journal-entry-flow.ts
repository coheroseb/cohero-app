
/**
 * @fileOverview An AI flow to revise a social work journal entry based on feedback.
 *
 * - reviseJournalEntry - A function that takes a journal entry and feedback, then returns a revised version.
 * - ReviseJournalEntryInput - The input type for the function.
 * - ReviseJournalEntryOutput - The return type for the function.
 */

'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { FeedbackDataSchema } from './types';

const ReviseJournalEntryInputSchema = z.object({
  journalEntry: z.string().describe("The social work student's original journal entry."),
  feedback: FeedbackDataSchema.describe("The feedback object from the three personas."),
});
export type ReviseJournalEntryInput = z.infer<typeof ReviseJournalEntryInputSchema>;

const RevisedJournalEntryDataSchema = z.object({
  revisedJournalEntry: z.string().describe("The revised journal entry, rewritten to incorporate the feedback while maintaining a professional journal format."),
});

const ReviseJournalEntryOutputSchema = z.object({
  data: RevisedJournalEntryDataSchema,
  usage: z.object({
    inputTokens: z.number(),
    outputTokens: z.number(),
  }),
});
export type ReviseJournalEntryOutput = z.infer<typeof ReviseJournalEntryOutputSchema>;

export async function reviseJournalEntry(input: ReviseJournalEntryInput): Promise<ReviseJournalEntryOutput> {
  return reviseJournalEntryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'reviseJournalEntryPrompt',
  input: { schema: ReviseJournalEntryInputSchema },
  output: { schema: RevisedJournalEntryDataSchema },
  prompt: `You are an expert social work supervisor. A social work student has received feedback on a journal entry, and your task is to rewrite the entry to incorporate the suggestions.

**CRITICAL INSTRUCTIONS:**
- Rewrite the original journal entry. DO NOT just list the feedback.
- Integrate the suggestions naturally into the text.
- The final output MUST be a complete, coherent journal entry in Danish.
- Maintain a professional, objective tone suitable for a legal document.
- DO NOT add commentary, explanations, or meta-text. ONLY provide the revised journal text.
- Always use the term "borger" instead of "klient".

**Original Journal Entry:**
---
{{{journalEntry}}}
---

**Feedback to Incorporate:**
- **Juridisk:** {{{feedback.juridisk.feedback}}} (Score: {{{feedback.juridisk.score}}})
- **Erfaren:** {{{feedback.erfaren.feedback}}} (Score: {{{feedback.erfaren.score}}})
- **Travl:** {{{feedback.travl.feedback}}} (Score: {{{feedback.travl.score}}})

Your response must be a JSON object with a single key: "revisedJournalEntry".
`,
});

const reviseJournalEntryFlow = ai.defineFlow(
  {
    name: 'reviseJournalEntryFlow',
    inputSchema: ReviseJournalEntryInputSchema,
    outputSchema: ReviseJournalEntryOutputSchema,
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
