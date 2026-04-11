import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { getIcdEntityDetails } from '../../lib/icd-helper';

export const getDiagnoseDetailsFlow = ai.defineFlow(
  {
    name: 'getDiagnoseDetailsFlow',
    inputSchema: z.object({
        id: z.string().describe('The WHO ICD-11 entity ID or URL')
    }),
    outputSchema: z.object({
        success: z.boolean(),
        diagnosis: z.object({
            id: z.string(),
            code: z.string().nullable().optional(),
            titleDa: z.string(),
            titleEn: z.string(),
            descriptionDa: z.string(),
            longDefinition: z.string().optional(),
            symptomsDa: z.array(z.string()).optional(),
            inclusions: z.array(z.string()).optional(),
            exclusions: z.array(z.string()).optional(),
            diagnosticCriteria: z.string().optional(),
            narrowerTerms: z.array(z.object({
                id: z.string(),
                title: z.string()
            })).optional(),
            socialWorkContext: z.string(),
            legalAnchors: z.array(z.string()).optional()
        }).optional(),
        error: z.string().optional()
    }),
  },
  async (input) => {
    try {
        console.log(`[Flow-Details] Fetching details for: "${input.id}"`);
        const details = await getIcdEntityDetails(input.id);
        
        const diagnosis = {
            id: input.id,
            code: details.theCode || 'N/A',
            titleDa: details.title?.['@value'] || 'Ingen titel', 
            titleEn: details.title?.['@value'] || 'No title',
            descriptionDa: details.definition?.['@value'] || 'Ingen yderligere beskrivelse tilgængelig fra WHO.', 
            longDefinition: details.longDefinition?.['@value'] || '',
            symptomsDa: details.synonyms?.map((s: any) => s.label?.['@value']) || [],
            inclusions: details.inclusion?.map((i: any) => i.label?.['@value']) || [],
            exclusions: details.exclusion?.map((e: any) => e.label?.['@value']) || [],
            diagnosticCriteria: details.diagnosticCriteria?.['@value'] || '',
            narrowerTerms: await Promise.all((details.child?.slice(0, 10) || []).map(async (c: any) => {
                try {
                    const isString = typeof c === 'string';
                    const childId = isString ? c : (c['@id'] || '');
                    
                    if (!isString && c.title?.['@value']) {
                        return { id: childId, title: c.title['@value'] };
                    }

                    const childDetails = await getIcdEntityDetails(childId);
                    return { id: childId, title: childDetails.title?.['@value'] || 'Underkategori' };
                } catch (e) {
                    return { id: '', title: '' };
                }
            })).then(terms => terms.filter(t => t.id && t.title)),
            socialWorkContext: 'Officiel WHO definition.',
            legalAnchors: []
        };

        return {
            success: true,
            diagnosis
        };
        
    } catch (error: any) {
        console.error('[Flow-Details] Error:', error);
        return {
            success: false,
            error: error.message || 'Fejl ved hentning af detaljer'
        };
    }
  }
);
