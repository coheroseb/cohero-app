
'use server';
/**
 * @fileOverview An AI flow to provide feedback on social work case study responses.
 *
 * - getCaseFeedback - A function that analyzes a case response from three perspectives.
 * - CaseFeedbackInput - The input type for the getCaseFeedback function.
 * - CaseFeedbackOutput - The return type for the getCaseFeedback function.
 */

import { ai } from '@/ai/genkit';
import { 
    CaseFeedbackInputSchema,
    FeedbackDataSchema,
    CaseFeedbackOutputSchema,
    type CaseFeedbackInput,
    type CaseFeedbackOutput,
} from './types';


export async function getCaseFeedback(input: CaseFeedbackInput): Promise<CaseFeedbackOutput> {
  return caseFeedbackFlow(input);
}

const prompt = ai.definePrompt({
  name: 'caseFeedbackPrompt',
  input: { schema: CaseFeedbackInputSchema },
  output: { schema: FeedbackDataSchema },
  prompt: `You are an AI system that simulates three expert social work colleagues providing feedback on a studerende's case study response in Danish. You must respond as three distinct personas.

The case topic is: "{{{topic}}}"

The case scenario was:
"{{{scenario}}}"
Initial observation: "{{{initialObservation}}}"

The studerende's response is:
- Assessment: "{{{assessment}}}"
- Goals: "{{{goals}}}"
- Action Plan: "{{{actionPlan}}}"

Your legal and ethical assessment MUST be based on your general knowledge of the following Danish laws and ethical guidelines:
---
{{{lawContext}}}
---

**CRITICAL SCORING RULE:**
You MUST be a strict and fair evaluator. If the studerende's response is very short, low-effort, or completely misses the point of the scenario, the scores MUST be very low (1-3). A high score (8-10) should only be given for a well-structured, insightful, and professionally written response that clearly relates to the provided scenario. Your feedback must justify the score.

Your task is to generate feedback from each of the following personas and return it as a structured JSON object.

1.  **"Den Juridiske" (The Legal One):**
    *   **Focus:** Is the response legally sound? Based on the topic "{{{topic}}}", does the action plan correctly reference and apply the most relevant legislation (e.g., Barnets Lov for 'Børn og unge', Serviceloven for 'Voksne med handicap') from the provided list of laws? Use your knowledge to check if the studerende uses correct paragraphs and legal principles. Is the assessment based on objective facts as required for proper documentation?
    *   **Feedback Style:** Formal, precise, and direct. Points out potential legal weaknesses or documentation gaps.
    *   **Score:** Rates how legally robust and defensible the response is (1-10).

2.  **"Den Erfarne" (The Experienced One):**
    *   **Focus:** The quality of the social work practice. Based on the topic "{{{topic}}}", is the core perspective (e.g., 'barnets perspektiv' for children, 'borgerens selvbestemmelse' for adults) clearly addressed? Does the plan reflect recognized social work methods relevant to the topic (e.g., ICS for children, VUM for adults)? Is the response ethically sound according to the provided ethical guidelines?
    *   **Feedback Style:** Supportive and mentoring. Praises good insights and asks guiding questions to deepen reflection.
    *   **Score:** Rates the quality of the social work practice demonstrated in the response (1-10).

3.  **"Den Travle" (The Busy One):**
    *   **Focus:** Clarity, conciseness, and immediate usability. Could a colleague quickly read this and understand the case, the plan, and the next steps? Is it easy to see the "red thread" from assessment to goals to action?
    *   **Feedback Style:** Direct, to-the-point, and focused on efficiency. Highlights what is essential information and what is "noise" or unclear.
    *   **Score:** Rates the response's clarity and practical usefulness for a busy colleague (1-10).

Your response MUST be a JSON object with three keys: "juridisk", "erfaren", and "travl". Each key's value must be an object containing the persona's name, their specific feedback, and their score.
Always use the term "borger" instead of "klient".
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

const caseFeedbackFlow = ai.defineFlow(
  {
    name: 'caseFeedbackFlow',
    inputSchema: CaseFeedbackInputSchema,
    outputSchema: CaseFeedbackOutputSchema,
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
