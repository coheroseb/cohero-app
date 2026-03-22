// @ts-nocheck

/**
 * @fileOverview An AI flow to revise a social work journal entry based on feedback.
 *
 * - reviseJournalEntry - A function that takes a journal entry and feedback, then returns a revised version.
 * - ReviseJournalEntryInput - The input type for the function.
 * - ReviseJournalEntryOutput - The return type for the function.
 */



import { ai } from '@/ai/genkit';
import { z } from 'genkit';
const ReviseJournalEntryInputSchema = z.object({
  journalEntry: z.string().describe("The social work student's original journal entry."),
  feedback: z.string().describe("The feedback object stringified to incorporate."),
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
{{{feedback}}}

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
        inputTokens: usage.inputTokens || 0,
        outputTokens: usage.outputTokens || 0
      }
    };
  }
);
