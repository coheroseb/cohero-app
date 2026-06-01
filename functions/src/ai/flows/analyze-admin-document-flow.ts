import axios from 'axios';
// @ts-nocheck
import { ai } from '@/ai/genkit';
import {
  AnalyzeAdminDocumentInputSchema,
  AdminDocumentAnalysisSchema,
  AnalyzeAdminDocumentOutputSchema,
} from './types';

export const analyzeAdminDocumentFlow = ai.defineFlow(
  {
    name: 'analyzeAdminDocumentFlow',
    inputSchema: AnalyzeAdminDocumentInputSchema,
    outputSchema: AnalyzeAdminDocumentOutputSchema,
  },
  async (input) => {
    let mediaObj;
    if (input.pdfUrl) {
      const response = await axios.get(input.pdfUrl, { responseType: 'arraybuffer' });
      const base64 = Buffer.from(response.data).toString('base64');
      mediaObj = { media: { url: `data:application/pdf;base64,${base64}`, contentType: 'application/pdf' } };
    } else {
      mediaObj = { media: { url: `data:application/pdf;base64,${input.pdfBase64}`, contentType: 'application/pdf' } };
    }

    const { output, usage } = await ai.generate({
      model: 'googleai/gemini-3.1-flash-lite',
      prompt: [
        mediaObj,
        {
          text: `Du er en kritisk og konstruktiv ekspert i dokumentanalyse og feedback. Du har fået vedhæftet en PDF-fil (f.eks. en studieopgave eller en sagsfremstilling).

**Din primære opgave:**
Besvar følgende spørgsmål med fokus på **forbedringspotentiale, mangler og kritiske observationer**. Du skal ikke blot gengive hvad der står, men analysere kvaliteten, dybden og korrektheden af indholdet i forhold til spørgsmålene.

**Spørgsmål:**
${input.questions.map((q, i) => `${i + 1}. ${q}`).join('\n')}

**Dine instruktioner for feedback:**
1. **Fokus på forbedring:** For hvert spørgsmål skal du vurdere, hvordan indholdet kan styrkes. Hvad mangler? Hvad kunne gøres skarpere?
2. **Kritisk analyse:** Vær ærlig og direkte. Hvis noget er uklart, overfladisk eller mangler kildehenvisninger/faglighed, så påpeg det.
3. **Konstruktive forslag:** Kom med konkrete forslag til, hvordan forfatteren kan løfte niveauet.
4. **Overordnet vurdering:** Lav til sidst en opsummering, der fokuserer på de 3 vigtigste områder, dokumentet skal forbedre for at opnå et højere niveau.

Dit svar SKAL være et JSON-objekt, der matcher formatet:
{
  "results": [
    { "question": "spørgsmål 1", "answer": "svar 1" },
    ...
  ],
  "overallConclusion": "din opsummering"
}`
        }
      ],
      output: { schema: AdminDocumentAnalysisSchema },
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
        inputTokens: usage.inputTokens || 0,
        outputTokens: usage.outputTokens || 0,
      },
    };
  }
);
