import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ModuleSchema = z.object({
  id: z.string().describe("Module/Semester ID, e.g. 'Modul 1' or 'Semester 4'"),
  name: z.string().describe("Full name of the module"),
  ects: z.number().optional(),
  learningGoals: z.array(z.string()).describe("Specific learning goals (læringsmål)"),
  examForm: z.string().optional().describe("Description of the exam form"),
});

export const ProcessStudyRegulationInputSchema = z.object({
  pdfBase64: z.string().describe("Base64 encoded PDF content."),
  institution: z.string().optional(),
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
      model: 'googleai/gemini-2.0-flash-exp',
      prompt: [
        { media: { url: `data:application/pdf;base64,${input.pdfBase64}`, contentType: 'application/pdf' } },
        { text: `You are an expert academic coordinator for social work studies in Denmark. Your task is to analyze the provided PDF of a "Studieordning" (Study Regulations) and extract a structured index of the modules and their learning goals.

Please identify:
1. **title**: A descriptive title (e.g., "Studieordning for Socialrådgiveruddannelsen 2024").
2. **institution**: The name of the educational institution.
3. **year**: The version or year of the regulation.
4. **modules**: An array of objects for each course module or semester. Each module must contain:
   - 'id': The module number or identifier (e.g., '1' for semester 1).
   - 'name': The full name of the module (e.g. 'Socialt arbejde og jura').
   - 'ects': The number of ECTS points (if available).
   - 'learningGoals': An array of strings, each being a specific, concrete learning goal (læringsmål) for that module.
   - 'examForm': A brief description of the exam form for the module.

Respond in Danish for the content fields.` }
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

