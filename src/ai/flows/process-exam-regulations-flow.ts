
/**
 * @fileOverview AI flow to process exam regulations and generate a portfolio structure.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const ExamRegulationInputSchema = z.object({
  text: z.string().describe("The extracted text from the exam regulation document."),
});

const PortfolioSectionSchema = z.object({
  title: z.string().describe("Titel på afsnittet (f.eks. 'Metode', 'Problemformulering')."),
  assignment: z.string().describe("En præcis vejledning til den studerende om, hvad de skal skrive i dette afsnit jf. bestemmelserne."),
  characterLimit: z.string().optional().describe("Eventuelle krav til antal anslag, sider eller omfang for dette specifikke afsnit."),
});

const ExamRegulationOutputSchema = z.object({
  sections: z.array(PortfolioSectionSchema),
});

export type ExamRegulationOutput = z.infer<typeof ExamRegulationOutputSchema>;

export async function processExamRegulations(input: z.infer<typeof ExamRegulationInputSchema>): Promise<ExamRegulationOutput> {
  const { output } = await ai.generate({
    model: 'googleai/gemini-2.5-flash',
    output: { schema: ExamRegulationOutputSchema },
    system: "Du er en dansk akademisk vejleder. Din opgave er at analysere en 'Prøvebestemmelse' (eksamensregler) og opstille en logisk struktur for en portfolio eller et projektarbejde. Sørg for at afsnittene følger en korrekt akademisk rækkefølge (f.eks. Problemformulering -> Metode -> Teori -> Analyse -> Konklusion).\n\nFor hvert afsnit skal du:\n1. Skrive en præcis titel.\n2. Lave en kort, men udtømmende vejledning (assignment) til, hvad den studerende skal adressere.\n3. Identificere eventuelle specifikke krav til omfang (f.eks. 'mellem 2.400 og 4.800 anslag' eller 'max 2 sider'). Hvis ingen specifikke krav findes for afsnittet, efterlad feltet tomt.\n\nSvar på dansk.",
    prompt: `Analyser følgende prøvebestemmelse og opstille en struktur for projektet/portfolioen:\n\n${input.text.substring(0, 20000)}`,
  });

  return output!;
}
