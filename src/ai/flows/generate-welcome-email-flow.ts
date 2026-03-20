'use server';
/**
 * @fileOverview An AI flow to generate a welcome email for new users.
 *
 * - generateWelcomeEmail - A function that creates the subject and body of a welcome email.
 * - WelcomeEmailInput - The input type for the generateWelcomeEmail function.
 * - WelcomeEmailOutput - The return type for the generateWelcomeEmail function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import {
    WelcomeEmailInputSchema,
    WelcomeEmailDataSchema,
    WelcomeEmailOutputSchema,
    type WelcomeEmailInput,
    type WelcomeEmailOutput,
    type WelcomeEmailData,
} from './types';


export async function generateWelcomeEmail(input: WelcomeEmailInput): Promise<WelcomeEmailOutput> {
  return generateWelcomeEmailFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateWelcomeEmailPrompt',
  input: { schema: WelcomeEmailInputSchema },
  output: { schema: WelcomeEmailDataSchema },
  prompt: `You are a friendly onboarding assistant for Cohéro, a platform for social work students. Your tone is warm, professional, and encouraging.

A new user named {{{userName}}} has just signed up.

Your task is to write a warm and welcoming HTML email to them.

The email's subject line MUST be "Velkommen til Cohéro, din digitale fagfælle!".

The email body must:
1.  Welcome them personally by name ({{{userName}}}).
2.  Reiterate Cohéro's core mission: To be a digital colleague that helps bridge the gap between theory and practice, focusing on sparring and reflection rather than tutoring.
3.  Suggest 2-3 concrete first steps for the user to take to get started and experience the value of the platform. Good examples are:
    - "Prøv Case-træneren for at teste dine færdigheder i et realistisk scenarie."
    - "Få et hurtigt overblik over et komplekst begreb med vores Begrebsguide."
    - "Udforsk vores Studieteknikker for at optimere din læsning."
4.  Include a clear, visually distinct call-to-action button that links to the portal (\`https://cohero.dk/portal\`).
5.  End with a friendly closing from "Cohéro Teamet".
6.  The entire output must be in Danish and use simple, robust HTML for formatting (e.g., \`<p>\`, \`<strong>\`, \`<ul>\`, \`<li>\`, and an \`<a>\` tag styled as a button).

Example of a good button:
\`<a href="https://cohero.dk/portal" style="display: inline-block; background-color: #1a0c02; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Gå til din portal</a>\`

The final output should be a JSON object with "subject" and "body" keys.
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

const generateWelcomeEmailFlow = ai.defineFlow(
  {
    name: 'generateWelcomeEmailFlow',
    inputSchema: WelcomeEmailInputSchema,
    outputSchema: WelcomeEmailOutputSchema,
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
