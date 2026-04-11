import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { searchIcdEntities, getIcdEntityDetails } from '../../lib/icd-helper';

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
    inclusions: z.array(z.string()).optional(),
    exclusions: z.array(z.string()).optional(),
    diagnosticRequirements: z.string().optional(),
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

        // 2. Map raw API results to our format and fetch deep details
        const diagnoses = await Promise.all(icdResults.destinationEntities.slice(0, 5).map(async (entity: any) => {
            try {
                const details = await getIcdEntityDetails(entity.id);
                
                return {
                    id: entity.id,
                    code: details.theCode || entity.theCode || 'N/A',
                    titleDa: details.title?.['@value'] || entity.title, 
                    titleEn: entity.title,
                    descriptionDa: details.definition?.['@value'] || 'Ingen yderligere beskrivelse tilgængelig fra WHO.', 
                    symptomsDa: details.synonyms?.map((s: any) => s.label?.['@value']) || [],
                    inclusions: details.inclusion?.map((i: any) => i.label?.['@value']) || [],
                    exclusions: details.exclusion?.map((e: any) => e.label?.['@value']) || [],
                    diagnosticRequirements: details.diagnosticCriteria?.['@value'] || '',
                    socialWorkContext: 'Officiel WHO definition.',
                    legalAnchors: []
                };
            } catch (e) {
                return {
                    id: entity.id,
                    code: entity.theCode || 'N/A',
                    titleDa: entity.title,
                    titleEn: entity.title,
                    descriptionDa: 'Kunne ikke hente yderligere detaljer fra WHO.', 
                    symptomsDa: [],
                    socialWorkContext: 'Socialfaglig guide er deaktiveret.',
                    legalAnchors: []
                };
            }
        }));

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
