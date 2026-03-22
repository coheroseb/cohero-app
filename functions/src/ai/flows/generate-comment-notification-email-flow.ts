// @ts-nocheck

/**
 * @fileOverview An AI flow to generate a notification email for a new comment.
 *
 * - generateCommentNotificationEmail - A function that creates the subject and body of the notification email.
 * - CommentNotificationEmailInput - The input type.
 * - CommentNotificationEmailOutput - The return type.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { 
    CommentNotificationEmailInputSchema, 
    CommentNotificationEmailOutputSchema,
    type CommentNotificationEmailInput,
    type CommentNotificationEmailOutput
} from './types';


export async function generateCommentNotificationEmail(input: CommentNotificationEmailInput): Promise<CommentNotificationEmailOutput> {
  return generateCommentNotificationEmailFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateCommentNotificationEmailPrompt',
  input: { schema: CommentNotificationEmailInputSchema },
  output: { schema: CommentNotificationEmailOutputSchema },
  prompt: `You are a friendly community manager for Cohéro, a platform for social work students.

Your task is to write a notification email to {{{postAuthorName}}} because {{{commenterName}}} has commented on their post.

The email must:
1.  Have a clear and friendly subject line like "Ny kommentar til dit opslag".
2.  Congratulate the user on the engagement.
3.  Clearly state who commented and on which post ("{{{postTitle}}}").
4.  Include a prominent, clickable link or button that uses the provided {{{postUrl}}}. The link text should be clear, e.g., "Se kommentaren her".
5.  Be professional, friendly, and match the tone of a platform for students.
6.  The entire output must be in Danish and use simple HTML for formatting.

Example of a good button:
\`<a href="{{{postUrl}}}" style="background-color: #1a0c02; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Se kommentaren</a>\`
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

const generateCommentNotificationEmailFlow = ai.defineFlow(
  {
    name: 'generateCommentNotificationEmailFlow',
    inputSchema: CommentNotificationEmailInputSchema,
    outputSchema: CommentNotificationEmailOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
