import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { searchIcdEntities } from '../../lib/icd-helper';

const SearchDiagnoseInputSchema = z.object({
  query: z.string().describe('The name of the diagnosis or symptoms to search for.'),
  profession: z.string().optional().describe('The profession of the user for tailored explanation.')
});

const SearchDiagnoseOutputSchema = z.object({
  success: z.boolean(),
  diagnoses: z.array(z.object({
    id: z.string(),
    code: z.string().optional(),
    titleDa: z.string(),
    titleEn: z.string(),
    descriptionDa: z.string(),
    socialWorkContext: z.string().describe('How this diagnosis affects social work or the citizens rights.')
  })),
  error: z.string().optional()
});

export const searchDiagnoseFlow = ai.defineFlow(
  {
    name: 'searchDiagnoseFlow',
    inputSchema: SearchDiagnoseInputSchema,
    outputSchema: SearchDiagnoseOutputSchema,
  },
  async (input) => {
    try {
        // 1. Search ICD-11
        const icdResults = await searchIcdEntities(input.query);
        
        if (!icdResults.destinationEntities || icdResults.destinationEntities.length === 0) {
            return { success: true, diagnoses: [] };
        }

        // 2. Take top 3 results and enrich them with AI
        const topResults = icdResults.destinationEntities.slice(0, 3);
        
        const enrichedDiagnoses = await Promise.all(topResults.map(async (entity: any) => {
            const { output } = await ai.generate({
                model: 'googleai/gemini-2.0-flash',
                prompt: `Du er en ekspert i både psykiatri og dansk socialret. 
                Her er data på en diagnose fra WHO (ICD-11):
                Engelsk Titel: ${entity.title}
                Id: ${entity.id}
                
                Dine opgaver:
                1. Oversæt titlen til præcis dansk fagterminologi.
                2. Giv en kort, letforståelig beskrivelse på dansk af diagnosen (2-3 sætninger).
                3. Forklar hvad denne diagnose betyder i en dansk socialfaglig kontekst for en ${input.profession || 'socialrådgiver'}. 
                   Tænk på: Hvilke paragraffer i serviceloven/barnets lov kan være relevante? Hvilke udfordringer kan borgeren have i hverdagen?
                
                Returner svaret på dansk.`,
                output: {
                    schema: z.object({
                        titleDa: z.string(),
                        descriptionDa: z.string(),
                        socialWorkContext: z.string()
                    })
                }
            });

            return {
                id: entity.id,
                code: entity.theCode,
                titleDa: output?.titleDa || entity.title,
                titleEn: entity.title,
                descriptionDa: output?.descriptionDa || '',
                socialWorkContext: output?.socialWorkContext || ''
            };
        }));

        return {
            success: true,
            diagnoses: enrichedDiagnoses
        };
        
    } catch (error: any) {
        console.error('Error in searchDiagnoseFlow:', error);
        return {
            success: false,
            diagnoses: [],
            error: error.message
        };
    }
  }
);
