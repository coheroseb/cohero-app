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
      model: 'googleai/gemini-2.5-flash',
      prompt: [
        mediaObj,
        {
          text: `Du er en ekspert i dokumentanalyse. Du har fået vedhæftet en PDF-fil.
Din opgave er at besvare følgende spørgsmål baseret KUN på indholdet i dokumentet.

**Spørgsmål:**
${input.questions.map((q, i) => `${i + 1}. ${q}`).join('\n')}

**Dine instruktioner:**
1. Besvar hvert spørgsmål grundigt og præcist.
2. Hvis et spørgsmål ikke kan besvares ud fra dokumentet, skal du skrive "Oplysningen findes ikke i dokumentet".
3. Lav til sidst en overordnet konklusion eller opsummering af dokumentets vigtigste pointer i forhold til spørgsmålene.

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
        inputTokens: usage.inputTokens,
        outputTokens: usage.outputTokens,
      },
    };
  }
);
