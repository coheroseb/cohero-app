'use server';
/**
 * @fileOverview An AI flow to generate a verification email for new users.
 *
 * - generateVerificationEmail - A function that creates the subject and body of a verification email.
 * - VerificationEmailInput - The input type for the generateVerificationEmail function.
 * - VerificationEmailOutput - The return type for the generateVerificationEmail function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const VerificationEmailInputSchema = z.object({
  userName: z.string().describe("The name of the new user."),
  verificationLink: z.string().url().describe("The unique email verification link."),
});
export type VerificationEmailInput = z.infer<typeof VerificationEmailInputSchema>;

const VerificationEmailOutputSchema = z.object({
  subject: z.string().describe("The subject line of the email."),
  body: z.string().describe("The body of the email, which can include HTML for formatting."),
});
export type VerificationEmailOutput = z.infer<typeof VerificationEmailOutputSchema>;


export async function generateVerificationEmail(input: VerificationEmailInput): Promise<VerificationEmailOutput> {
  return generateVerificationEmailFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateVerificationEmailPrompt',
  input: { schema: VerificationEmailInputSchema },
  output: { schema: VerificationEmailOutputSchema },
  prompt: `You are a friendly onboarding assistant for Cohéro, a platform for social work students.

Your task is to write a verification email to a user named {{{userName}}}.

The email must:
1.  Welcome them and thank them for signing up.
2.  Clearly explain that they need to click a link/button to verify their email address.
3.  Include a prominent, clickable link or button that uses the provided {{{verificationLink}}}. The link text should be clear, e.g., "Bekræft din e-mail".
4.  Be professional, friendly, and match the tone of a platform for students.
5.  The entire output must be in Danish and use simple HTML for formatting.

Example of a good button:
\`<a href="{{{verificationLink}}}" style="background-color: #1a0c02; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Bekræft din e-mail</a>\`
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

const generateVerificationEmailFlow = ai.defineFlow(
  {
    name: 'generateVerificationEmailFlow',
    inputSchema: VerificationEmailInputSchema,
    outputSchema: VerificationEmailOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
