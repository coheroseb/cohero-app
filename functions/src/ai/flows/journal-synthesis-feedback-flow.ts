// @ts-nocheck
/**
 * @fileOverview AI flow to provide "synthesis" feedback on social work journal entries.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { type SourceItem } from './generate-raw-case-sources-flow';

const JournalSynthesisFeedbackInputSchema = z.object({
  topic: z.string(),
  sources: z.any().describe('The array of raw sources the user had to read.'),
  journalEntry: z.string(),
  lawContext: z.string()
});
export type JournalSynthesisFeedbackInput = z.infer<typeof JournalSynthesisFeedbackInputSchema>;

const ImprovementItemSchema = z.object({
  originalQuote: z.string().describe('A short, exact quote from the student\'s text that is problematic.'),
  problemType: z.enum(['subjektivt_sprog', 'manglende_fakta', 'upassende_tone', 'juridisk_fejl']).describe('Categorization of the issue.'),
  suggestedImprovement: z.string().describe('How to rewrite this sentence to be objective, factual, and legally sound.'),
  reasoning: z.string().describe('A very brief explanation of why the original quote is problematic (e.g. "Påtager sig en dommerrolle").')
});
export type ImprovementItem = z.infer<typeof ImprovementItemSchema>;

const JournalSynthesisFeedbackDataSchema = z.object({
  overallScore: z.number().describe('Score from 1 to 10 for overall quality.'),
  objectivityScore: z.number().describe('Score from 1 to 10 for objectivity and neutrality.'),
  generalFeedback: z.string().describe('A brief, encouraging but professional paragraph summarizing overall performance. HTML paragraphs.'),
  improvements: z.array(ImprovementItemSchema).describe('A list of up to 5 specific inline improvements extracted from their text.')
});
export type JournalSynthesisFeedbackData = z.infer<typeof JournalSynthesisFeedbackDataSchema>;

const JournalSynthesisFeedbackOutputSchema = z.object({
  data: JournalSynthesisFeedbackDataSchema,
  usage: z.object({
    inputTokens: z.number(),
    outputTokens: z.number(),
  }),
});
export type JournalSynthesisFeedbackOutput = z.infer<typeof JournalSynthesisFeedbackOutputSchema>;

export async function journalSynthesisFeedback(input: JournalSynthesisFeedbackInput): Promise<JournalSynthesisFeedbackOutput> {
  return journalSynthesisFeedbackFlow(input);
}

const prompt = ai.definePrompt({
  name: 'journalSynthesisFeedbackPrompt',
  input: { schema: JournalSynthesisFeedbackInputSchema },
  output: { schema: JournalSynthesisFeedbackDataSchema },
  prompt: `You are an expert social work supervisor in Denmark providing feedback on a student's journal note.
The student was tasked with synthesizing information from "raw, messy sources" into a professional, objective journal entry.

The topic of the case was: "{{{topic}}}"

RAW SOURCES THE STUDENT RECEIVED:
---
{{{sources}}}
---

THE STUDENT'S JOURNAL ENTRY:
---
"{{{journalEntry}}}"
---

Relevant laws:
---
{{{lawContext}}}
---

YOUR TASK:
1. Provide an overall assessment of how well they synthesized the messy information into an objective professional note without adopting the subjective language of the sources.
2. Give an overall score (1-10) and an objectivity score (1-10). If they copied subjective tone directly (e.g. "moderen er doven"), score extremely low on objectivity.
3. Critically important: Find up to 5 exact quotes in their text that are either too subjective, lack factual basis, or use inappropriate slang/tone. 
   - Extract the exact string as \`originalQuote\`.
   - Categorize it.
   - Provide an objective \`suggestedImprovement\`.
   - Explain the \`reasoning\`.
   If the text is perfect, you can provide fewer or zero improvements, but most student texts have at least 1-2 points for refinement.

You must respond in Danish.
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

const journalSynthesisFeedbackFlow = ai.defineFlow(
  {
    name: 'journalSynthesisFeedbackFlow',
    inputSchema: JournalSynthesisFeedbackInputSchema,
    outputSchema: JournalSynthesisFeedbackOutputSchema,
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
