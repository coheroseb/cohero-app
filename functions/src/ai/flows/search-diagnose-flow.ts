import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { searchIcdEntities } from '../../lib/icd-helper';
import { getRelevantLawContext } from '../../lib/law-context-helper';

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

export const searchDiagnoseFlow = ai.defineFlow(
  {
    name: 'searchDiagnoseFlow',
    inputSchema: SearchDiagnoseInputSchema,
    outputSchema: SearchDiagnoseOutputSchema,
  },
  async (input) => {
    try {
        // 1. Search ICD-11
        console.log(`[Flow] Starting search for: "${input.query}"`);
        const icdResults = await searchIcdEntities(input.query);
        console.log(`[Flow] ICD Results found: ${icdResults.destinationEntities?.length || 0}`);
        
        if (!icdResults.destinationEntities || icdResults.destinationEntities.length === 0) {
            return { success: true, diagnoses: [] };
        }

        // 2. Take top 3 results and enrich them with AI
        const topResults = icdResults.destinationEntities.slice(0, 3);
        
        const enrichedDiagnoses = await Promise.all(topResults.map(async (entity: any) => {
            // 2b. Fetch actual law context from our Lovportal
            console.log(`[Flow] Fetching law context for: "${entity.title}"`);
            const lawContext = await getRelevantLawContext(entity.title);

            const { output } = await ai.generate({
                model: 'googleai/gemini-2.5-flash',
                prompt: `Du er en top-ekspert i psykiatri, klinisk psykologi og dansk socialret.
                Brugeren er en ${input.profession || 'socialrådgiver'}.
                
                Her er data fra WHO (ICD-11):
                Engelsk Titel: ${entity.title}
                Id: ${entity.id}
                
                {{#if lawContext}}
                **KONTEKST FRA LOVPORTALEN (Brug dette til Juridisk Forankring):**
                ---
                {{{lawContext}}}
                ---
                {{/if}}

                Dine opgaver:
                1. Oversæt titlen til præcis dansk fagterminologi.
                2. ICD-11 Kode: Find den præcise ICD-11 kode (f.eks. 6A02). Hvis koden ikke er oplyst, skal du forsøge at identificere den korrekt ud fra din kliniske viden.
                3. Beskrivelse: Giv en professionel definition af diagnosen.
                3. Kernesymptomer: Oplist de 3-5 vigtigste kliniske tegn på denne diagnose.
                4. Socialfaglig betydning: Forklar dybdegående hvad dette betyder for borgerens funktionsevne. Hvordan påvirker det evnen til at arbejde, gå i skole eller være forælder?
                5. Lovgivning: Nævn de absolut mest relevante paragraffer (f.eks. § 82, 85, 114 i Serviceloven eller specifikke dele af Barnets Lov), DER FINDES i ovenstående lovkontekst eller er alment kendte for denne diagnose.
                
                Returner svaret på dansk i et struktureret JSON format.`,
                output: {
                    schema: z.object({
                        titleDa: z.string(),
                        code: z.string().optional().describe('The ICD-11 code (e.g. 6A02)'),
                        descriptionDa: z.string(),
                        symptomsDa: z.array(z.string()),
                        socialWorkContext: z.string(),
                        legalAnchors: z.array(z.string()).describe('List specific paragraphs or laws found in the portal or relevant for this track')
                    })
                },
                // @ts-ignore
                promptData: { lawContext }
            });

            return {
                id: entity.id,
                code: output?.code || entity.theCode || 'ICD-11',
                titleDa: output?.titleDa || entity.title,
                titleEn: entity.title,
                descriptionDa: output?.descriptionDa || '',
                symptomsDa: output?.symptomsDa || [],
                socialWorkContext: output?.socialWorkContext || '',
                legalAnchors: output?.legalAnchors || []
            };
        }));

        return {
            success: true,
            diagnoses: enrichedDiagnoses
        };
        
    } catch (error: any) {
        console.error('[Flow] Error in searchDiagnoseFlow:', error);
        return {
            success: false,
            diagnoses: [],
            error: error.message || 'Ukendt fejl i Diagnose-flowet'
        };
    }
  }
);
