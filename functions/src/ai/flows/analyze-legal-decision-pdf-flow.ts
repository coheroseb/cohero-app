// @ts-nocheck
import { ai } from '@/ai/genkit';
import {
  AnalyzeLegalDecisionPdfInputSchema,
  LegalDecisionAnalysisDataSchema,
  AnalyzeLegalDecisionOutputSchema,
} from './types';

export const analyzeLegalDecisionPdfFlow = ai.defineFlow(
  {
    name: 'analyzeLegalDecisionPdfFlow',
    inputSchema: AnalyzeLegalDecisionPdfInputSchema,
    outputSchema: AnalyzeLegalDecisionOutputSchema,
  },
  async (input) => {
    const { output, usage } = await ai.generate({
      model: 'googleai/gemini-2.0-flash',
      prompt: [
        { media: { url: `data:application/pdf;base64,${input.pdfBase64}`, contentType: 'application/pdf' } },
        {
          text: `Du er en ekspert i dansk socialret og en erfaren mentor for socialrådgiverstuderende.
Din opgave er at lave et pædagogisk resume af den vedhæftede juridiske afgørelse (PDF).

**Afgørelsens Titel:** "${input.title}"

**Din opgave (på dansk):**
Udfyld følgende to felter i et JSON-objekt. Brug et letforståeligt men professionelt sprog.

1.  **Hvad er afgørelsen? (hvadErAfgørelsen):** Forklar selve konklusionen eller resultatet af sagen. Hvad blev der besluttet? Gør det konkret og praksisnært.
2.  **På baggrund af hvad? (påBaggrundAfHvad):** Forklar præmisserne for afgørelsen. Hvilke specifikke paragraffer, juridiske principper eller faktiske omstændigheder i sagen blev lagt til grund? 

Dit svar SKAL være et JSON-objekt, der matcher output-skemaet.`
        }
      ],
      output: { schema: LegalDecisionAnalysisDataSchema },
      config: {
        safetySettings: [
          { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_LOW_AND_ABOVE' },
        ],
      },
    });

    return {
      data: output!,
      usage: {
        inputTokens: usage.inputTokens,
        outputTokens: usage.outputTokens,
      },
    };
  }
);
