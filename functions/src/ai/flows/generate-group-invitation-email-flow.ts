// @ts-nocheck

/**
 * @fileOverview An AI flow to generate an invitation email for a study group.
 *
 * - generateGroupInvitationEmail - Creates the subject and body of the invite.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { 
    GroupInvitationEmailInputSchema, 
    GroupInvitationEmailOutputSchema,
    type GroupInvitationEmailInput,
    type GroupInvitationEmailOutput
} from './types';


export async function generateGroupInvitationEmail(input: GroupInvitationEmailInput): Promise<GroupInvitationEmailOutput> {
  return generateGroupInvitationEmailFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateGroupInvitationEmailPrompt',
  input: { schema: GroupInvitationEmailInputSchema },
  output: { schema: GroupInvitationEmailOutputSchema },
  prompt: `You are a friendly community connector for Cohéro, a platform for social work students.

Your task is to write a warm and encouraging invitation email to {{{inviteeName}}}. Their colleague, {{{inviterName}}}, has just added them to the study group "{{{groupName}}}".

The email must:
1.  Have a clear and friendly subject line like "Velkommen til gruppen: {{{groupName}}}".
2.  Briefly explain that Cohéro is their digital colleague that helps bridge the gap between theory and practice.
3.  Clearly state who invited them and the purpose of the group.
4.  Include a prominent, clickable button or link that uses the provided {{{groupUrl}}}. The link text should be clear, e.g., "Gå til gruppens rum".
5.  Be professional, supporting, and match the tone of a collaborative platform for students.
6.  The entire output must be in Danish and use simple HTML for formatting.

Example of a good button:
\`<a href="{{{groupUrl}}}" style="display: inline-block; background-color: #1a0c02; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Gå til gruppen</a>\`
`,
});

const generateGroupInvitationEmailFlow = ai.defineFlow(
  {
    name: 'generateGroupInvitationEmailFlow',
    inputSchema: GroupInvitationEmailInputSchema,
    outputSchema: GroupInvitationEmailOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
