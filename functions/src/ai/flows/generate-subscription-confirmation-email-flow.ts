// @ts-nocheck

/**
 * @fileOverview An AI flow to generate a subscription confirmation email.
 *
 * - generateSubscriptionConfirmationEmail - Creates the email content.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { SubscriptionConfirmationEmailInputSchema, SubscriptionConfirmationEmailOutputSchema, type SubscriptionConfirmationEmailInput, type SubscriptionConfirmationEmailOutput } from './types';


export async function generateSubscriptionConfirmationEmail(input: SubscriptionConfirmationEmailInput): Promise<SubscriptionConfirmationEmailOutput> {
  return generateSubscriptionConfirmationEmailFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateSubscriptionConfirmationEmailPrompt',
  input: { schema: SubscriptionConfirmationEmailInputSchema },
  output: { schema: SubscriptionConfirmationEmailOutputSchema },
  prompt: `You are a friendly community manager for Cohéro. Your task is to write an email confirming a user's new subscription.

The user is {{{userName}}} and they have subscribed to {{{membershipLevel}}}.

The email must:
1.  Have a clear subject like "Tak for din opgradering til {{{membershipLevel}}}!".
2.  Confirm the new subscription and thank the user.
3.  Briefly mention the key benefits of their new plan.
4.  Include a call-to-action button linking to the portal ('https://cohero.dk/portal').
5.  Be professional, friendly, and in Danish, using simple HTML for formatting.

Example button:
\`<a href="https://cohero.dk/portal" style="display: inline-block; background-color: #1a0c02; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Gå til portalen</a>\`
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

const generateSubscriptionConfirmationEmailFlow = ai.defineFlow(
  {
    name: 'generateSubscriptionConfirmationEmailFlow',
    inputSchema: SubscriptionConfirmationEmailInputSchema,
    outputSchema: SubscriptionConfirmationEmailOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
