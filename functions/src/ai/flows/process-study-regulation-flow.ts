import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ModuleSchema = z.object({
  id: z.string().describe("Module/Semester ID, e.g. 'Modul 1' or 'Semester 4'"),
  name: z.string().describe("Full name of the module"),
  ects: z.number().optional(),
  description: z.string().describe("Brief summary or 'Om modulet' description"),
  learningGoals: z.array(z.string()).describe("Specific learning goals (læringsmål)"),
  examForm: z.string().optional().describe("Description of the exam form"),
});

export const ProcessStudyRegulationInputSchema = z.object({
  pdfBase64: z.string().describe("Base64 encoded PDF content."),
  institution: z.string().optional(),
  profession: z.string().optional(),
});

export const ProcessStudyRegulationOutputSchema = z.object({
  title: z.string(),
  institution: z.string(),
  year: z.string().optional(),
  modules: z.array(ModuleSchema),
});

export const processStudyRegulationFlow = ai.defineFlow(
  {
    name: 'processStudyRegulationFlow',
    inputSchema: ProcessStudyRegulationInputSchema,
    outputSchema: ProcessStudyRegulationOutputSchema,
  },
  async (input) => {
    const { output } = await ai.generate({
      model: 'googleai/gemini-2.0-flash',
      prompt: [
        { media: { url: `data:application/pdf;base64,${input.pdfBase64}`, contentType: 'application/pdf' } },
        { text: `You are an expert academic coordinator for social work studies in Denmark. Your task is to analyze the provided PDF of a "Studieordning" (Study Regulations) and extract a structured index of the modules and their learning goals.

Please identify:
1. **title**: A descriptive title (e.g., "Studieordning for Socialrådgiveruddannelsen 2024").
2. **institution**: The name of the educational institution.
3. **year**: The version or year of the regulation.
4. **modules**: Find ALLE semestre (f.eks. Semester 1-7). Hvert modul skal have:
   - 'id': Numret på semesteret (f.eks. '1').
   - 'name': Navnet på semesteret.
   - 'ects': ECTS point.
   - 'description': En kort beskrivelse af semesters fokus.
   - 'learningGoals': Liste af læringsmål.
   - 'examForm': Beskrivelse af prøveform.

Besvar på dansk. Fokusér på den gældende uddannelse for ${input.institution || 'institutionen'}.` }







      ],
      output: { schema: ProcessStudyRegulationOutputSchema },
      config: {
        safetySettings: [
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' }
        ]
      }
    });

    if (!output) throw new Error("AI failed to parse the study regulation.");
    
    // Merge institution if provided manually
    if (input.institution && !output.institution) {
      output.institution = input.institution;
    }

    return output;
  }
);

