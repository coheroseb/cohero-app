import { ai } from '@/ai/genkit';
import { z } from 'genkit';

export const translateDiagnoseFlow = ai.defineFlow(
  {
    name: 'translateDiagnoseFlow',
    inputSchema: z.object({
      text: z.string(),
      context: z.string().optional()
    }),
    outputSchema: z.object({
      translatedText: z.string()
    }),
  },
  async (input) => {
    const { output } = await ai.generate({
      model: 'googleai/gemini-3.5-flash',
      prompt: `Du er en professionel oversætter specialiseret i medicinsk og socialfaglig terminologi.
      Oversæt nedenstående tekst fra engelsk til flydende, fagligt korrekt dansk.
      
      Tekst:
      "${input.text}"
      
      ${input.context ? `Kontekst: ${input.context}` : ''}
      
      Svar KUN med den oversatte tekst.`,
    });

    return {
      translatedText: output?.text || 'Oversættelse mislykkedes.'
    };
  }
);
