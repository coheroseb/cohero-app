import { ai } from '../genkit';
import { z } from 'genkit';
import {
  IdentifyReformInputSchema,
  IdentifyReformOutputSchema,
} from './types';

/**
 * identifyReformFlow
 * 
 * An AI flow that interprets a user's question about a reform and identifies
 * the most relevant documents (bills and consolidated laws) on Retsinformation.
 */
export const identifyReformFlow = ai.defineFlow(
  {
    name: 'identifyReformFlow',
    inputSchema: IdentifyReformInputSchema,
    outputSchema: IdentifyReformOutputSchema,
  },
  async (input) => {
    const prompt = ai.definePrompt({
        name: 'identifyReformPrompt',
        input: { schema: IdentifyReformInputSchema },
        output: { schema: z.object({
            candidates: z.array(z.object({
                title: z.string(),
                documentId: z.string(),
                type: z.enum(['LF', 'LBK']),
                summary: z.string(),
                xmlUrl: z.string().url(),
            })),
            rationale: z.string(),
        })},
        prompt: `Du er en ekspert i det danske lovgivningssystem og Retsinformation. DIN OPGAVE er at hjælpe en socialrådgiver med at finde de præcise dokumenter for en lovreform.

Brugerens spørgsmål: "{{{query}}}"

Baseret på din viden om dansk socialret og lovgivning, skal du identificere:
1. De centrale **Lovforslag (LF)**, som udgør reformen.
2. De eksisterende **Lovbekendtgørelser (LBK)**, som reformen ændrer på.

For hver kandidat skal du angive:
- **title**: Den officielle eller populære titel (f.eks. "Lov om ændring af lov om aktiv socialpolitik (Kontanthjælpsreform)").
- **documentId**: Det unikke ID eller L-nummer (f.eks. L 123).
- **type**: Om det er 'LF' (forslag) eller 'LBK' (gældende lov).
- **summary**: Hvorfor dette dokument er vigtigt for at forstå reformen.
- **xmlUrl**: Den direkte XML-sti hos Retsinformation. 
  *   **FOR LOVFORSLAG (LF):** Brug formatet: https://www.retsinformation.dk/eli/ft/{AccessionNumber}/xml
      Hvor AccessionNumber følger mønsteret: {Session}2L{Nummer-polstret-til-5-cifre}
      - Session for 2023/1 er "20231"
      - Session for 2024/1 er "20241"
      - Eksempel: For L 152 i 2023/1 session er AccessionNumber "202312L00152"
      - Eksempel: For L 13 i 2024/1 session er AccessionNumber "202412L00013"
  *   **FOR LOVBEKENDTGØRELSER (LBK):** Brug formatet: https://www.retsinformation.dk/eli/lta/{År}/{Nummer}/xml
      (Eksempel: For LBK nr 1031 af 2023 er ELI /eli/lta/2023/1031/xml)

**VIGTIG VIDEN OM AKTUELLE REFORMER (2023-2025):**
- **Kontanthjælpsreformen / Beskæftigelsesreformen (2024):** 
  * Lovforslag: 2024/1 LSF 13 (Accession: 202412L00013)
  * Lovbekendtgørelser: LBK nr. 1031 (Aktiv socialpolitik) og LBK nr. 280 (Aktiv beskæftigelsesindsats)
- **Barnets Lov (2023):** 
  * Lov: LOV nr. 721 af 13/06/2023 (Accession: A20230072129)
  * ELI: /eli/lta/2023/721/xml

Brug denne viden til at generere de korrekte ELI-stier. Fokusér på præcision for at undgå 404/500 eller irrelevante dokumenter som f.eks. EU-forordninger hvis brugeren spørger om dansk socialret.

Svar altid på dansk.`
    });

    const { output, usage } = await prompt(input);
    
    console.log("Identify Reform Output:", JSON.stringify(output?.candidates.map(c => ({ title: c.title, xmlUrl: c.xmlUrl })), null, 2));
    
    return {
      data: output!,
      usage: {
        inputTokens: usage.inputTokens ?? 0,
        outputTokens: usage.outputTokens ?? 0,
      },
    };
  }
);
