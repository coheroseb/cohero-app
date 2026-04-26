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
            breadcrumbs: z.array(z.object({
                id: z.string(),
                title: z.string()
            })).optional(),
            socialWorkContext: z.string(),
            legalAnchors: z.array(z.string()).optional(),
            relevantLegalParagraphs: z.array(z.object({
                paragraph: z.string(),
                description: z.string()
            })).optional(),
        }).optional(),
        error: z.string().optional()
    }),
  },
  async (input) => {
    try {
        console.log(`[Flow-Details] Fetching details for: "${input.id}"`);
        const details = await getIcdEntityDetails(input.id);
        
        // Parallel data retrieval for speed and depth
        const [narrowerTerms, legalMapping] = await Promise.all([
          // 1. Resolve child titles as before
          Promise.all((details.child?.slice(0, 10) || []).map(async (c: any) => {
              try {
                  const isString = typeof c === 'string';
                  const childId = isString ? c : (c['@id'] || '');
                  if (!isString && c.title?.['@value']) return { id: childId, title: c.title['@value'] };
                  const childDetails = await getIcdEntityDetails(childId);
                  return { id: childId, title: childDetails.title?.['@value'] || 'Underkategori' };
              } catch (e) { return { id: '', title: '' }; }
          })).then(terms => terms.filter(t => t.id && t.title)),

          // 2. High-speed AI mapping to Danish Social Law/Ankestyrelsen principles
          ai.generate({
              model: 'googleai/gemini-2.5-flash',
              prompt: `Du er en ekspert i dansk socialret og ICD-11.
              Givet denne kliniske diagnose fra WHO ICD-11:
              Navn: "${details.title?.['@value']}"
              Definition: "${details.definition?.['@value']}"
              
              Find de 3-5 mest centrale paragraffer i den danske lovgivning (Serviceloven, Barnets Lov, Sundhedsloven m.fl.) eller Principafgørelser, der typisk bringes i anvendelse for at yde hjælp til denne diagnosegruppe.
              Fokusér på praktisk socialt arbejde (støtte, hjælpemidler, tabt arbejdsfortjeneste, botilbud).
              Giv et kortvarigt pædagogisk input til hver kilde.
              Svar på dansk.`,
              output: {
                  schema: z.object({
                      paragraphs: z.array(z.object({
                          paragraph: z.string().describe('Lov og paragraf, f.eks. Serviceloven § 85'),
                          description: z.string().describe('Hvorfor er denne relevant?')
                      }))
                  })
              }
          })
        ]);

        // 3. Resolve Breadcrumbs (Ancestor path)
        const breadcrumbs: { id: string, title: string }[] = [];
        let currentParentUrl = details.parent?.[0];
        
        for (let i = 0; i < 4; i++) {
            if (!currentParentUrl || currentParentUrl.includes('root')) break;
            try {
                const pDetails = await getIcdEntityDetails(currentParentUrl);
                breadcrumbs.unshift({
                    id: currentParentUrl,
                    title: pDetails.title?.['@value'] || 'Overkategori'
                });
                currentParentUrl = pDetails.parent?.[0];
            } catch (e) {
                break;
            }
        }
        
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
            narrowerTerms,
            socialWorkContext: 'Officiel WHO definition med pædagogisk lov-kobling.',
            legalAnchors: [],
            relevantLegalParagraphs: legalMapping?.output?.paragraphs || []
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
