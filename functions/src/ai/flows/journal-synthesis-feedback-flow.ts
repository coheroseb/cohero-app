// @ts-nocheck
/**
 * @fileOverview AI flow to provide "synthesis" feedback on social work journal entries.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const JournalSynthesisFeedbackInputSchema = z.object({
  topic: z.string(),
  sources: z.any().describe('The array of raw sources the user had to read.'),
  complexityHints: z.string().optional().describe('Hints about the case complexity to guide the AI.'),
  journalEntry: z.string(),
  lawContext: z.string(),
  profession: z.string().optional().describe('The profession of the user (e.g., Socialrådgiver, Pædagog).')
});
export type JournalSynthesisFeedbackInput = z.infer<typeof JournalSynthesisFeedbackInputSchema>;

const ImprovementItemSchema = z.object({
  originalQuote: z.string().describe('A short, exact quote from the student\'s text that is problematic.'),
  problemType: z.enum(['subjektivt_sprog', 'manglende_fakta', 'modstridende_info', 'upassende_tone', 'juridisk_fejl']).describe('Categorization of the issue.'),
  suggestedImprovement: z.string().describe('How to rewrite this sentence to be objective, factual, and legally sound.'),
  reasoning: z.string().describe('A very brief explanation of why the original quote is problematic.'),
  teachingPoint: z.string().describe('The general professional principle the student should learn from this mistake.')
});
export type ImprovementItem = z.infer<typeof ImprovementItemSchema>;

const JournalSynthesisFeedbackDataSchema = z.object({
  overallScore: z.number().describe('Score from 1 to 10 for overall quality.'),
  objectivityScore: z.number().describe('Score from 1 to 10 for objectivity and neutrality.'),
  legalScore: z.number().describe('Score from 1 to 10 for legal grounding.'),
  factScore: z.number().describe('Score from 1 to 10 for correct fact extraction from messy sources.'),
  generalFeedback: z.string().describe('A professional summary of performance. HTML paragraphs.'),
  strengths: z.array(z.string()).describe('List of things the student did well.'),
  improvements: z.array(ImprovementItemSchema).describe('A list of up to 6 specific inline improvements extracted from their text.')
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
  prompt: `You are an expert supervisor for the profession: "{{{profession}}}" (default to Socialrådgiver if not specified). Your task is to provide strict, pedagogically valuable feedback on a student's journal note, with a heavy focus on professional objectivity and legal correctness.
{{#if profession}}
For a "Pædagog", you MUST focus on pedagogical documentation, observations of child development, relational coordination, and institutional practice.
For a "Socialrådgiver", you MUST focus on sagsbehandling, administrative objectivity, and statutory documentation.
{{/if}}

CASE TOPIC: "{{{topic}}}"
COMPLEXITY HINTS: "{{{complexityHints}}}" (Verify if the student caught these "traps" or contradictions).

RAW SOURCES (The messy inbox):
---
{{{sources}}}
---

STUDENT'S NOTE (To be evaluated):
---
"{{{journalEntry}}}"
---

LEGAL CONTEXT (Use this to verify all paragraph references):
---
{{{lawContext}}}
---

TASK:
1. **Legal Cross-Check**: Verify any law mentions or paragraph references (e.g., "§ 11", "Barnets Lov"). Compare them strictly against the LEGAL CONTEXT. 
   - If a reference is wrong, flag it as 'juridisk_fejl'.
   - If a reference is missing but relevant, suggest it in an improvement.
2. **Scoring**: Provide scores (1-10) for Quality, Objectivity, Legal Grounding, and Fact Extraction.
3. **Synthesis**: Check if the student resolved contradictions between sources (e.g. if source A and B disagreed, how did the student document it professionally?).
4. **Actionable Feedback**: Identify up to 6 exact quotes that need improvement, each with a 'teachingPoint' explaining the social work principle.
5. **Strengths**: Find 2-3 specific strengths where the student handled difficult information well.
6. **General Feedback**: A constructive, professional summary using social work terminology.

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
