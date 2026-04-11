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
    code: z.string().nullable().optional(),
    titleDa: z.string(),
    titleEn: z.string(),
    descriptionDa: z.string(),
    symptomsDa: z.array(z.string()).optional(),
    socialWorkContext: z.string(),
    legalAnchors: z.array(z.string()).optional()
  })),
  error: z.string().optional()
});

/**
 * PURE API SEARCH FLOW (NO AI)
 * Following user request to strip AI logic for now.
 */
export const searchDiagnoseFlow = ai.defineFlow(
  {
    name: 'searchDiagnoseFlow',
    inputSchema: SearchDiagnoseInputSchema,
    outputSchema: SearchDiagnoseOutputSchema,
  },
  async (input) => {
    try {
        // 1. Search ICD-11 API directly
        console.log(`[Flow-PureAPI] Searching for: "${input.query}"`);
        const icdResults = await searchIcdEntities(input.query);
        
        if (!icdResults.destinationEntities || icdResults.destinationEntities.length === 0) {
            return { success: true, diagnoses: [] };
        }

        // 2. Map raw API results to our format
        const diagnoses = icdResults.destinationEntities.slice(0, 10).map((entity: any) => {
            return {
                id: entity.id,
                code: entity.theCode || 'N/A',
                titleDa: entity.title, // Fallback to English since AI translation is removed
                titleEn: entity.title,
                descriptionDa: 'Information fra WHO ICD-11 registeret.', 
                symptomsDa: [],
                socialWorkContext: 'Socialfaglig guide er deaktiveret.',
                legalAnchors: []
            };
        });

        return {
            success: true,
            diagnoses
        };
        
    } catch (error: any) {
        console.error('[Flow-PureAPI] Error:', error);
        return {
            success: false,
            diagnoses: [],
            error: error.message || 'Fejl ved opslag i ICD-11 API'
        };
    }
  }
);
