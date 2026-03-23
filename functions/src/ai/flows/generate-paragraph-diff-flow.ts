import { ai } from '../genkit';
import { z } from 'genkit';
import {
  GenerateParagraphDiffInputSchema,
  GenerateParagraphDiffOutputSchema,
  ParagraphDiffSchema,
} from './types';
import { getLawContent } from './get-law-content-flow';

/**
 * generateParagraphDiffFlow
 * 
 * Takes an old consolidated law (LBK) and a new bill (LF) XML URL,
 * compares relevant paragraphs, and provides a structured "Diff" with explanations
 * from the bill's explanatory notes (bemærkninger).
 */
export const generateParagraphDiffFlow = ai.defineFlow(
  {
    name: 'generateParagraphDiffFlow',
    inputSchema: GenerateParagraphDiffInputSchema,
    outputSchema: GenerateParagraphDiffOutputSchema,
  },
  async (input) => {
    console.log("Generating Paragraph Diff for:", input.targetLawTitle);
    console.log("Bill XML URL:", input.newBillXmlUrl);
    console.log("Law XML URL:", input.oldLawXmlUrl);

    // 1. Fetch the Bill (The new proposed changes)
    const billRes = await getLawContent({
        documentId: 'new-bill',
        xmlUrl: input.newBillXmlUrl,
        name: 'Lovforslag'
    });
    const billText = billRes.data.rawText;

    // 2. Fetch the current Law (The existing text)
    const lawRes = await getLawContent({
        documentId: 'old-law',
        xmlUrl: input.oldLawXmlUrl,
        name: input.targetLawTitle
    });
    const lawText = lawRes.data.rawText;

    const prompt = ai.definePrompt({
        name: 'generateParagraphDiffPrompt',
        input: { schema: z.object({ billText: z.string(), lawText: z.string(), targetLaw: z.string() }) },
        output: { schema: z.object({
            reformTitle: z.string(),
            diffs: z.array(ParagraphDiffSchema),
            overallImpact: z.string(),
        })},
        prompt: `Du er en ekspert i dansk lovgivning og en dygtig juridisk analytiker.
DIN OPGAVE er at sammenligne et lovforslag med den eksisterende lovtekst for: "{{targetLaw}}".

**KONTEKST:**
--- LOVFORSLAG (LF) ---
{{billText}}

--- EKSISTERENDE LOV (LBK/LOV) ---
{{lawText}}

**DINE OPGAVER:**
1.  **Identificer Præcise Paragraffer**: Find ændringerne (ÆNDRING:) og deres tilhørende paragraffer. Generér en **fangende overskrift** (headline) for hver ændring.
2.  **Udfør tekstsammenligning**:
    -   Hent den **gamle ordlyd** for paragraffen.
    -   Hent den **nye ordlyd** fra reformen.
3.  **Forklar impact (KORT OG PRÆCIST)**: Skriv en letforståelig forklaring på dansk om, hvad ændringen betyder i virkeligheden for en borger eller fagperson. Hold det kort – undgå lange komplekse sætninger.
4.  **Find årsagen**: Find hensigten bag ændringen (bemærkningerne).
5.  **Overordnet betydning**: Lav en opsummering af hele reformens betydning. Brug gerne punktopstilling hvis muligt, så det er hurtigt at læse.

**OUTPUT FORMAT:**
- **reformTitle**: En sigende titel.
- **diffs**: En liste over hver ændret paragraf. Hver diff SKAL have en sigende 'headline'.
- **overallImpact**: En KORT opsummering (brug gerne bullets).

Svar altid på dansk.`
    });

    const { output, usage } = await prompt({
        billText,
        lawText,
        targetLaw: input.targetLawTitle
    });

    return {
      data: output!,
      usage: {
        inputTokens: usage.inputTokens ?? 0,
        outputTokens: usage.outputTokens ?? 0,
      },
    };
  }
);
