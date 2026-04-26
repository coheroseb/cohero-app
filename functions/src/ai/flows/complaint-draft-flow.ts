
import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ComplaintDraftInputSchema = z.object({
  analysisResult: z.any().describe("The results from the second opinion analysis."),
  institution: z.string().optional(),
  profession: z.string().optional(),
  moduleName: z.string().optional(),
});

const ComplaintDraftOutputSchema = z.object({
  draft: z.string().describe("The formal complaint draft in Danish."),
  status: z.string().describe("Advice on how to send the complaint."),
});

export const complaintDraftFlow = ai.defineFlow(
  {
    name: 'complaintDraftFlow',
    inputSchema: ComplaintDraftInputSchema,
    outputSchema: ComplaintDraftOutputSchema,
  },
  async (input) => {
    const { output } = await ai.generate({
      model: 'googleai/gemini-2.5-flash',
      prompt: `Du er en erfaren akademisk vejleder og ekspert i det danske karaktersystem. Din opgave er at hjælpe en studerende med at udforme en formel, faglig og saglig klage over en karakter.

KLAGEGRUNDLAG (Analyse fra Second Opinion):
${JSON.stringify(input.analysisResult)}

CONTEXT:
Uddannelse: ${input.profession || 'Uddannelsen'}
Institution: ${input.institution || 'Institutionen'}
Modul/Semester: ${input.moduleName || 'Modulet'}

INSTRUKTIONER:
1. Skriv klagen i et professionelt, akademisk og respektfuldt sprog.
2. Klagen skal være baseret på de faglige mangler i bedømmelsen, som analysen har identificeret.
3. Fokusér på uoverensstemmelser mellem opgavens indhold og de officielle læringsmål (læringsmål fra studieordningen).
4. Brug konkrete eksempler fra opgaven (hvis de findes i analysen) til at underbygge argumentationen.
5. Klagen skal opstilles som et formelt brev/email med plads til studerendes navn, dato og modtager (studienævnet).
6. Inkludér en kort vejledning til slut om, hvordan den sendes (Deadlines, process etc.).

SVAR PÅ DANSK. Resultatet skal være i HTML-format (brug <h3>, <p>, <ul>, <li>, <strong>).`,
      output: { schema: ComplaintDraftOutputSchema },
      config: {
        safetySettings: [
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' }
        ]
      }
    });

    if (!output) throw new Error("AI failed to generate complaint draft.");
    return output;
  }
);
