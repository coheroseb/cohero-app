
/**
 * @fileOverview An AI flow to generate a Memento streak reminder email.
 *
 * - generateStreakReminderEmail - Creates the subject and body of the reminder email.
 * - StreakReminderEmailInput - The input type.
 * - StreakReminderEmailOutput - The return type.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { 
    StreakReminderEmailInputSchema, 
    StreakReminderEmailOutputSchema,
    type StreakReminderEmailInput,
    type StreakReminderEmailOutput
} from './types';


export async function generateStreakReminderEmail(input: StreakReminderEmailInput): Promise<StreakReminderEmailOutput> {
  return generateStreakReminderEmailFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateStreakReminderEmailPrompt',
  input: { schema: StreakReminderEmailInputSchema },
  output: { schema: StreakReminderEmailOutputSchema },
  prompt: `You are a motivating coach for Cohéro. Your task is to write a short, encouraging email to remind a user to complete their daily Memento challenge to keep their streak alive.

The user is {{{userName}}} and their current streak is {{{streakCount}}} days.

The email must:
1.  Have a friendly and urgent subject line like "🔥 Pas på! Din Memento-streak på {{{streakCount}}} dage er ved at udløbe!".
2.  Briefly congratulate them on their current streak.
3.  Remind them they have until midnight to complete today's challenge.
4.  Include a prominent, clickable button that links to the Memento game ('https://cohero.dk/memento').
5.  Be professional, motivating, and in Danish, using simple HTML for formatting.

Example button:
\`<a href="https://cohero.dk/memento" style="display: inline-block; background-color: #1a0c02; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Tag dagens udfordring</a>\`
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

const generateStreakReminderEmailFlow = ai.defineFlow(
  {
    name: 'generateStreakReminderEmailFlow',
    inputSchema: StreakReminderEmailInputSchema,
    outputSchema: StreakReminderEmailOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
