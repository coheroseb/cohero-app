
'use server';
/**
 * @fileOverview An AI flow to provide feedback on social work journal entries.
 *
 * - getJournalFeedback - A function that analyzes a journal entry from three perspectives.
 */
import { ai } from '@/ai/genkit';
import { 
    FeedbackDataSchema,
    JournalFeedbackInputSchema,
    JournalFeedbackOutputSchema,
    type JournalFeedbackInput,
    type JournalFeedbackOutput,
} from './types';


export async function getJournalFeedback(input: JournalFeedbackInput): Promise<JournalFeedbackOutput> {
  return journalFeedbackFlow(input);
}

const prompt = ai.definePrompt({
  name: 'journalFeedbackPrompt',
  input: { schema: JournalFeedbackInputSchema },
  output: { schema: FeedbackDataSchema },
  prompt: `You are an AI system that simulates three expert social work colleagues providing feedback on a social work student's journal entry in Danish. The social work student has written the journal entry based on a given scenario. Use simple HTML tags like <strong>, <ul>, and <li> for formatting your feedback.

**YOUR FEEDBACK MUST BE BASED *ONLY* ON THE PROVIDED STUDENT TEXT. DO NOT INVENT OR HALLUCINATE ACTIONS OR STATEMENTS THAT ARE NOT PRESENT IN THE JOURNAL ENTRY.**

The case topic is: "{{{topic}}}"

The case scenario was:
"{{{scenario}}}"

The initial observation was:
"{{{initialObservation}}}"

Here is the social work student's journal entry:
---
"{{{journalEntry}}}"
---

Your legal and ethical assessment MUST be based **EXCLUSIVELY** on the following Danish laws and ethical guidelines provided in the \`lawContext\`. **DO NOT** use any external knowledge or make assumptions about laws not provided.
---
{{{lawContext}}}
---

**CRITICAL SCORING RULE:**
You MUST be a strict and fair evaluator. If the journal entry is very short, low-effort (like "her er mit notat"), or completely misses the point of the scenario, the scores MUST be very low (1-3). A high score (8-10) should only be given for a well-structured, insightful, and professionally written journal entry that clearly relates to the provided scenario. Your feedback must justify the score.

Your task is to generate feedback from each of the following personas and return it as a structured JSON object.

1.  **"Den Juridiske" (The Legal One):**
    *   **Focus:** Is this journal note legally sound based *exclusively* on the text provided by the student? **CRITICAL: DO NOT praise or mention legal references (e.g., specific paragraphs) if the student has not written them in the journal entry.** Your task is to evaluate what IS written, not what IS MISSING. For example, if the student mentions "Barnets Lov § 32", evaluate if that specific reference is correct in context. If they do *not* mention any laws, you must not say "din henvisning til X er god". Instead, focus on whether the *actions described* in the note are legally sound according to the provided legal context. Is the language objective and fact-based?
    *   **Feedback Style:** Formal, precise, and direct. Points out potential legal weaknesses or documentation gaps in the studerende's text.
    *   **Score:** Rates how legally robust and defensible the entry is (1-10).

2.  **"Den Erfarne" (The Experienced One):**
    *   **Focus:** The quality of the social work practice **as documented in the note**. Does the note show an understanding of the citizen's perspective? Does it reflect good social work methods? Does it clearly describe what happened and why the studerende plans to do what they do? Is the response ethically sound according to the provided ethical guidelines?
    *   **Feedback Style:** Supportive and mentoring. Praises good observations found in the text and asks guiding questions to deepen reflection on the documented actions.
    *   **Score:** Rates the quality of the social work practice as it is *documented* in the note (1-10).

3.  **"Den Travle" (The Busy One):**
    *   **Focus:** Clarity, brevity, and usability of the journal entry. Could a colleague quickly read **this specific note** and understand the situation, the plan, and the next steps? Is the note concise and to the point?
    *   **Feedback Style:** Direct and focused on efficiency. Highlights what is essential information and what is "noise" or unclear in the text.
    *   **Score:** Rates the entry's clarity and practical usefulness in a busy workday (1-10).

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

const journalFeedbackFlow = ai.defineFlow(
  {
    name: 'journalFeedbackFlow',
    inputSchema: JournalFeedbackInputSchema,
    outputSchema: JournalFeedbackOutputSchema,
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
