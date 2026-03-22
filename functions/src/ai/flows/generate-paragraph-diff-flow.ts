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
1.  **EKSTREMT VIGTIGT - Identificer Præcise Paragraffer**: Find de specifikke paragraffer (f.eks. "§ 8", "§ 23, stk. 2", "§ 114") i den eksisterende lov, som lovforslaget (markeret med ÆNDRING:) foreslår at ændre. Du SKAL inkludere paragrafnummeret i 'paragraph' feltet.
2.  **Udfør tekstsammenligning**:
    -   Udtræk den **gamle tekst** fra den eksisterende lov (LBK). Find den eksisterende ordlyd for den specifikke paragraf.
    -   Udtræk den **nye tekst** fra lovforslaget (ofte under NY TEKST: sektionen).
3.  **Find begrundelsen**: Led i lovforslagets "bemærkninger" efter årsagen til præcis denne ændring.
4.  **Forklar impact**: Skriv en kort, letforståelig forklaring på dansk om hvad ændringen betyder i praksis.

**OUTPUT FORMAT:**
Sørg for at returnere et objekt med:
- **reformTitle**: En sigende titel (f.eks. "Ændring af kontanthjælpssatser").
- **diffs**: En liste over hver enkelt ændret paragraf. Vær grundig og medtag alle væsentlige ændringer du finder i teksten.
- **overallImpact**: En opsummering af hele reformens betydning.

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
