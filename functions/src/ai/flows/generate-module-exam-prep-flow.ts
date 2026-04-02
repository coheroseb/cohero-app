import { z } from 'genkit';
import { ai } from '../genkit';
import { 
    ModuleExamPrepInputSchema, 
    ModuleExamPrepOutputSchema,
} from './types';
import { getRelevantLawContext } from '../../lib/law-context-helper';

/**
 * @fileOverview AI Flow til at generere modul-specifik eksamensforberedelse.
 * Giver studerende indsigt i begreber, modeller og lovgivning trukket fra Lovportalen.
 */

const prompt = ai.definePrompt({
  name: 'generateModuleExamPrepPrompt',
  input: { 
    schema: ModuleExamPrepInputSchema.extend({
        lawContext: z.string().optional()
    }) 
  },
  output: { schema: ModuleExamPrepOutputSchema.shape.data },
  prompt: `
    Du er en ekspert i socialrådgiveruddannelsen i Danmark. 
    Din opgave er at hjælpe en studerende med at forberede sig til eksamen i modulet: "{{{moduleName}}}".
    
    Læringsmål for modulet:
    {{{learningGoals}}}
    
    {{#if examForm}}
    Eksamensform: {{{examForm}}}
    {{/if}}

    {{#if lawContext}}
    **JURIDISK KONTEKST FRA LOVPORTALEN (Brug dette som primær kilde til lovgivning):**
    ---
    {{{lawContext}}}
    ---
    {{/if}}
    
    Generer følgende indhold på dansk:
    1. **Begreber**: 3-5 centrale akademiske begreber, der er afgørende for dette modul. Forklar dem kort og beskriv deres relevans for eksamen.
    2. **Modeller**: 2-3 teoretiske eller praktiske modeller (f.eks. Sagsbehandlingshjulet, Bronfenbrenner, SMARTE-mål, KASAM osv.), der er relevante. Forklar deres anvendelse.
    3. **Lovgivning**: 2-4 relevante love eller specifikke paragraffer (f.eks. Barnets Lov, Serviceloven, Retssikkerhedsloven), som den studerende bør kende til i denne kontekst. 
       - **VIGTIGT**: Hvis der er angivet "JURIDISK KONTEKST FRA LOVPORTALEN" ovenfor, skal du prioritere at trække specifikke paragraffer og forklaringer herfra.
       - Forklar kort hvorfor de er relevante for netop dette modul.
    
    Sørg for at svaret er struktureret, akademisk præcist og direkte anvendeligt til eksamenslæsning.
    Brug kun de mest anerkendte teorier og paragraffer inden for det danske socialfaglige felt.
  `,
});

export const generateModuleExamPrep = ai.defineFlow(
  {
    name: 'generateModuleExamPrepFlow',
    inputSchema: ModuleExamPrepInputSchema,
    outputSchema: ModuleExamPrepOutputSchema,
  },
  async (input) => {
    // Fetch relevant law context based on module name and learning goals
    const searchQuery = `${input.moduleName} ${input.learningGoals.join(' ')}`;
    console.log(`[MODULE-EXAM-PREP] Fetching Lovportal context for: "${searchQuery.substring(0, 50)}..."`);
    
    const lawContext = await getRelevantLawContext(searchQuery);

    const { output, usage } = await prompt({ ...input, lawContext });
    
    return {
      data: output!,
      usage: {
        inputTokens: usage.inputTokens || 0,
        outputTokens: usage.outputTokens || 0,
      },
    };
  }
);
