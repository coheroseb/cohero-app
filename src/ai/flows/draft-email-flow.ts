import { ai } from '@/ai/genkit';
import { z } from 'zod';
import {
  DraftEmailInputSchema,
  DraftEmailOutputSchema,
  type DraftEmailInput,
  type DraftEmailOutput
} from './types';

export async function draftEmail(input: DraftEmailInput): Promise<DraftEmailOutput> {
  return draftEmailFlow(input);
}

const prompt = ai.definePrompt({
  name: 'draftEmailPrompt',
  input: { schema: DraftEmailInputSchema },
  output: { schema: DraftEmailOutputSchema.shape.data },
  prompt: `Du er en ekspert i markedsføring og professionel kommunikation for platformen Cohéro.
    Din opgave er at skrive et fængende og professionelt nyhedsbrev i HTML-format (til brug i en rich-text editor).
    
    Emne eller stikord til mailen:
    {{{topic}}}
    
    Retningslinjer:
    1. Du skal generere en fængende "subject" (emnelinje).
    2. Du skal generere "htmlBody", som indeholder selve e-mailens indhold.
    3. Brug kun simple HTML-tags: <h2>, <h3>, <p>, <strong>, <em>, <ul>, <li>, <br>.
    4. Sørg for at teksten er velformuleret, indbydende, energisk og på dansk.
    5. Start altid mailen med en hilsen, hvor du bruger placeholderen "[Navn]". F.eks. "Kære [Navn]," eller "Hej [Navn],".
    6. Inkludér en professionel afslutning (f.eks. "De bedste hilsner, Team Cohéro").
    7. Returnér IKKE <html>, <head> eller <body> tags. Kun selve indholdet.
    8. Formater det med god luft mellem afsnit (brug margin eller <br>).
    `,
});

const draftEmailFlow = ai.defineFlow(
  {
    name: 'draftEmailFlow',
    inputSchema: DraftEmailInputSchema,
    outputSchema: DraftEmailOutputSchema,
  },
  async (input) => {
    const { output, usage } = await prompt(input);
    return {
      data: output!,
      usage: {
        inputTokens: usage?.inputTokens || 0,
        outputTokens: usage?.outputTokens || 0,
      }
    };
  }
);
