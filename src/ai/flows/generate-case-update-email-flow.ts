
import { ai } from '@/ai/genkit';
import { z } from 'zod';
import {
  CaseUpdateEmailInputSchema,
  CaseUpdateEmailOutputSchema,
  type CaseUpdateEmailInput,
  type CaseUpdateEmailOutput
} from './types';

export async function generateCaseUpdateEmail(input: CaseUpdateEmailInput): Promise<CaseUpdateEmailOutput> {
  return generateCaseUpdateEmailFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateCaseUpdateEmailPrompt',
  input: { schema: CaseUpdateEmailInputSchema },
  output: { schema: CaseUpdateEmailOutputSchema },
  prompt: `You are a helpful assistant for Cohéro. Your task is to write an email notifying a user about an update to a legal case they are following.
    
User: {{{userName}}}
Case Title: "{{{caseTitle}}}"

The email must:
1. Have a clear subject line like "Nyt om sagen: {{{caseTitle}}}".
2. Inform the user there has been an update.
3. Include a prominent, clickable button linking to the case URL: {{{caseUrl}}}.
4. Be professional, friendly, and in Danish, using simple HTML.

Example button:
\`<a href="{{{caseUrl}}}" style="display: inline-block; background-color: #1a0c02; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Se opdatering</a>\`
`,
});

const generateCaseUpdateEmailFlow = ai.defineFlow(
  {
    name: 'generateCaseUpdateEmailFlow',
    inputSchema: CaseUpdateEmailInputSchema,
    outputSchema: CaseUpdateEmailOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
