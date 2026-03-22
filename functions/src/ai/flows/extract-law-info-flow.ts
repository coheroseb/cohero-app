// @ts-nocheck

/**
 * @fileOverview An AI flow to extract structured information from a law text URL.
 *
 * - extractLawInfoFromUrl - A function that fetches a URL and extracts law details.
 * - ExtractLawInfoInput - The input type for the function.
 * - ExtractLawInfoOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ExtractLawInfoInputSchema = z.object({
  url: z.string().url().describe('The URL of the law text from retsinformation.dk.'),
});
export type ExtractLawInfoInput = z.infer<typeof ExtractLawInfoInputSchema>;

const ExtractedLawDataSchema = z.object({
  titel: z.string().describe('The official title of the law.'),
  nummer: z.string().optional().describe('The law number (lov nr.).'),
  dato: z.string().optional().describe('The date of the law (dato) in dd.mm.åååå format.'),
  lovbekendtgørelseNummer: z.string().optional().describe('The consolidation act number (lovbekendtgørelse nr.).'),
  lovbekendtgørelseDato: z.string().optional().describe('The date of the consolidation act in dd.mm.åååå format.'),
  sourceType: z.enum(['lov', 'bekendtgørelse', 'vejledning', 'principmeddelelse']).optional().describe("The type of legal source identified (e.g., 'lov', 'bekendtgørelse').")
});
export type ExtractedLawData = z.infer<typeof ExtractedLawDataSchema>;

const ExtractLawInfoOutputSchema = z.object({
  data: ExtractedLawDataSchema,
  usage: z.object({
    inputTokens: z.number(),
    outputTokens: z.number(),
  }),
});
export type ExtractLawInfoOutput = z.infer<typeof ExtractLawInfoOutputSchema>;

export async function extractLawInfoFromUrl(input: ExtractLawInfoInput): Promise<ExtractLawInfoOutput> {
  return extractLawInfoFlow(input);
}

const prompt = ai.definePrompt({
  name: 'extractLawInfoPrompt',
  input: { schema: z.object({ htmlContent: z.string() }) },
  output: { schema: ExtractedLawDataSchema },
  prompt: `You are an expert legal data extractor for the Danish legal system.
You will be given the raw HTML content of a page from retsinformation.dk.
Your task is to analyze the HTML and extract structured information.

1.  **Identify the Document Type**: First, determine the type of the legal source. It will be one of 'lov', 'bekendtgørelse', 'vejledning', or 'principmeddelelse'. Look for explicit headers or titles. If you see "Lovbekendtgørelse", the type is 'lov'. Return this in the \`sourceType\` field.
2.  **Extract Data**: Based on the type, extract the following:
    *   \`titel\`: The full, official title of the document.
    *   \`nummer\`: The document's number (e.g., "Lov nr. 123", "Bkg nr. 456"). For a "Lovbekendtgørelse", this field should be for the *original* law if found, otherwise empty. For "Principmeddelelse", this would be the identifier like "158-12".
    *   \`dato\`: The document's date in \`dd.mm.åååå\` format. For a "Lovbekendtgørelse", this should be the *original* law's date if found, otherwise empty.
    *   \`lovbekendtgørelseNummer\`: Only for "Lovbekendtgørelse". The consolidation act's number (e.g., "102").
    *   \`lovbekendtgørelseDato\`: Only for "Lovbekendtgørelse". The consolidation act's date in \`dd.mm.åååå\` format.

**Extraction Logic:**
- If the document is a **Lovbekendtgørelse** (e.g., "LBK nr 102 af 29/01/2018"):
    - \`sourceType\` should be 'lov'.
    - Populate \`lovbekendtgørelseNummer\` and \`lovbekendtgørelseDato\`.
    - \`titel\` is the main title.
    - Leave \`nummer\` and \`dato\` empty unless you can clearly identify the original law's details.
- If it is an original **Lov** (e.g., "LOV nr 502 af 23/05/2018"):
    - \`sourceType\` should be 'lov'.
    - Populate \`titel\`, \`nummer\`, and \`dato\`.
    - Leave consolidation fields empty.
- If it is a **Bekendtgørelse** or **Vejledning** (e.g., "BEK nr 1561 af 23/12/2014"):
    - Set \`sourceType\` to 'bekendtgørelse' or 'vejledning'.
    - Populate \`titel\`, \`nummer\`, and \`dato\`.
- If it is a **Principmeddelelse**:
    - \`sourceType\` should be 'principmeddelelse'.
    - The identifier (e.g., "158-12") can go in the \`titel\` field. \`nummer\` and \`dato\` are likely not applicable in the same way.

Ensure all dates are formatted as \`dd.mm.åååå\`.

Here is the HTML content:
\`\`\`html
{{{htmlContent}}}
\`\`\`

Return a single JSON object matching the output schema.
`,
  config: {
    safetySettings: [
      {
        category: 'HARM_CATEGORY_HATE_SPEECH',
        threshold: 'BLOCK_ONLY_HIGH',
      },
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_NONE',
      },
      {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
      {
        category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        threshold: 'BLOCK_LOW_AND_ABOVE',
      },
    ],
  },
});

const extractLawInfoFlow = ai.defineFlow(
  {
    name: 'extractLawInfoFlow',
    inputSchema: ExtractLawInfoInputSchema,
    outputSchema: ExtractLawInfoOutputSchema,
  },
  async ({ url }) => {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.statusText}`);
    }
    const htmlContent = await response.text();
    
    const { output, usage } = await prompt({ htmlContent });
    
    const formattedOutput = { ...output! };
    if (formattedOutput.dato) {
        formattedOutput.dato = formattedOutput.dato.replace(/\//g, '.');
    }
    if (formattedOutput.lovbekendtgørelseDato) {
        formattedOutput.lovbekendtgørelseDato = formattedOutput.lovbekendtgørelseDato.replace(/\//g, '.');
    }

    return {
      data: formattedOutput,
      usage: {
        inputTokens: usage.inputTokens,
        outputTokens: usage.outputTokens
      }
    };
  }
);
