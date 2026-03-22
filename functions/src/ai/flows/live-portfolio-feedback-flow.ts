// @ts-nocheck
import { ai } from '@/ai/genkit';
import { 
    LivePortfolioFeedbackInputSchema,
    LivePortfolioFeedbackOutputSchema,
    type LivePortfolioFeedbackInput,
    type LivePortfolioFeedbackOutput,
} from './types';


export async function getLivePortfolioFeedback(input: LivePortfolioFeedbackInput): Promise<LivePortfolioFeedbackOutput> {
  return livePortfolioFeedbackFlow(input);
}

const prompt = ai.definePrompt({
  name: 'livePortfolioFeedbackPrompt',
  input: { schema: LivePortfolioFeedbackInputSchema },
  output: { schema: LivePortfolioFeedbackOutputSchema },
  prompt: `You are an expert academic writing coach and social work supervisor. 
The student is writing a section for their portfolio in Danish.

Title of the section: "{{{title}}}"
Assignment Guidelines (if any): "{{{assignmentGuidelines}}}"
Linked Evidence/Sources available: "{{{linkedEvidenceTitles}}}"

Here is the current draft of the text:
---
{{{content}}}
---

Provide very short, punchy live feedback in Danish based on what they have written so far.
- "strength": Point out one good thing they are doing. Be specific but keep it under 15 words.
- "improvement": Suggest one actionable improvement (e.g., "Husk at henvise til [kilde]", "Dette afsnit mangler en tydelig konklusion"). Keep it under 20 words.
- "score": Rate the current text quality on a scale of 1-10 based on structure, academic tone, and alignment with guidelines.

CRITICAL: The feedback must be encouraging but highly constructive. Keep language natural Danish. DO NOT restate instructions.
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

const livePortfolioFeedbackFlow = ai.defineFlow(
  {
    name: 'livePortfolioFeedbackFlow',
    inputSchema: LivePortfolioFeedbackInputSchema,
    outputSchema: LivePortfolioFeedbackOutputSchema,
  },
  async (input) => {
    const { output, usage } = await prompt(input);
    return {
      feedback: output!.feedback,
      usage: {
        inputTokens: usage?.inputTokens || 0,
        outputTokens: usage?.outputTokens || 0
      }
    };
  }
);
