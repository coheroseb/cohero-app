// @ts-nocheck

/**
 * @fileOverview An AI flow to revise a social work case response based on feedback.
 *
 * - reviseCase - A function that takes a case response and feedback, then returns a revised version.
 * - ReviseCaseInput - The input type for the function.
 * - ReviseCaseOutput - The return type for the function.
 */



import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { FeedbackDataSchema } from './types';

const ReviseCaseInputSchema = z.object({
  scenario: z.string().describe("The case scenario text."),
  assessment: z.string().describe("The social work student's original assessment."),
  goals: z.string().describe("The social work student's original proposed goals."),
  actionPlan: z.string().describe("The social work student's original proposed action plan."),
  feedback: FeedbackDataSchema.describe("The feedback object from the three personas."),
});
export type ReviseCaseInput = z.infer<typeof ReviseCaseInputSchema>;

const RevisedCaseDataSchema = z.object({
  revisedCaseText: z.string().describe("A single string containing the rewritten assessment, goals, and action plan, formatted with simple HTML for structure (e.g., <h3>Vurdering</h3><p>...</p>)."),
});

const ReviseCaseOutputSchema = z.object({
  data: RevisedCaseDataSchema,
  usage: z.object({
    inputTokens: z.number(),
    outputTokens: z.number(),
  }),
});
export type ReviseCaseOutput = z.infer<typeof ReviseCaseOutputSchema>;

export async function reviseCase(input: ReviseCaseInput): Promise<ReviseCaseOutput> {
  return reviseCaseFlow(input);
}

const prompt = ai.definePrompt({
  name: 'reviseCasePrompt',
  input: { schema: ReviseCaseInputSchema },
  output: { schema: RevisedCaseDataSchema },
  prompt: `You are an expert social work supervisor. A social work student has received feedback on a case response, and your task is to rewrite the response to incorporate the suggestions.

**CRITICAL INSTRUCTIONS:**
- Rewrite the original response, combining the assessment, goals, and action plan into a single, coherent text.
- Use simple HTML headings (e.g., \`<h3>Vurdering</h3>\`, \`<h3>Mål</h3>\`, \`<h3>Handleplan</h3>\`) to structure the final text.
- Integrate the feedback naturally into the relevant sections.
- The final output MUST be a single string in Danish, formatted with HTML.
- Maintain a professional, objective tone suitable for a legal document.
- DO NOT add commentary or meta-text. ONLY provide the revised text.

**Case Scenario (for context):**
---
{{{scenario}}}
---

**Original Response:**
- Vurdering: "{{{assessment}}}"
- Mål: "{{{goals}}}"
- Handleplan: "{{{actionPlan}}}"

**Feedback to Incorporate:**
- Juridisk: {{{feedback.juridisk.feedback}}}
- Erfaren: {{{feedback.erfaren.feedback}}}
- Travl: {{{feedback.travl.feedback}}}

Your response must be a JSON object with a single key: "revisedCaseText". The value should be the complete, rewritten HTML string.
Always use the term "borger" instead of "klient".
`,
});

const reviseCaseFlow = ai.defineFlow(
  {
    name: 'reviseCaseFlow',
    inputSchema: ReviseCaseInputSchema,
    outputSchema: ReviseCaseOutputSchema,
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
