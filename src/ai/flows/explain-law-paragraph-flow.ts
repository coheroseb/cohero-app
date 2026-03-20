
'use server';
/**
 * @fileOverview An AI flow to explain a law paragraph for social work students.
 * - explainLawParagraph - Generates a student-oriented explanation.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const ExplainLawParagraphInputSchema = z.object({
  lovTitel: z.string().describe('The title of the law the paragraph belongs to.'),
  paragrafNummer: z.string().describe('The paragraph number, e.g., "§ 12".'),
  paragrafTekst: z.string().describe('The full text of the law paragraph to be explained.'),
  lovtekst: z.string().describe('The full text of the entire law for context, including explicit URLs to guidelines.'),
});
export type ExplainLawParagraphInput = z.infer<typeof ExplainLawParagraphInputSchema>;

const ExplanationSchema = z.object({
  kerneindhold: z.string().describe("A summary of the paragraph's core content in plain language."),
  betydningForPraksis: z.string().describe("An explanation of what this paragraph means for a social worker's practical, daily work. Include examples."),
  forholdTilAndreParagraffer: z.string().describe("A description of how this paragraph relates to other key paragraphs in the same law or other relevant laws."),
});
export type Explanation = z.infer<typeof ExplanationSchema>;

const ExplainLawParagraphOutputSchema = z.object({
  data: ExplanationSchema,
  usage: z.object({
    inputTokens: z.number(),
    outputTokens: z.number(),
  }),
});
export type ExplainLawParagraphOutput = z.infer<typeof ExplainLawParagraphOutputSchema>;


export async function explainLawParagraph(input: ExplainLawParagraphInput): Promise<ExplainLawParagraphOutput> {
  return explainLawParagraphFlow(input);
}

const prompt = ai.definePrompt({
  name: 'explainLawParagraphPrompt',
  input: { schema: ExplainLawParagraphInputSchema },
  output: { schema: ExplanationSchema },
  prompt: `Du er en ekspert i dansk socialret. Din opgave er at give en præcis, pædagogisk og praksisnær forklaring af en specifik paragraf udelukkende baseret på de medsendte kilder.

**KRITISK INSTRUKS:**
1.  **KUN MEDSENDTE KILDER:** Du må KUN bruge den information, der findes i 'JURIDISK KONTEKST' nedenfor. Du må ikke inddrage ekstern juridisk viden eller generel information, du måtte have fra din træning.
2.  **STRENG FORTOLKNING:** Dine forklaringer skal læne sig tæt op ad den officielle ordlyd og de tilknyttede vejledninger. Hvis en vejledning er vedlagt, SKAL dens fortolkning prioriteres.

**Paragraf til forklaring:**
Lov: "{{lovTitel}}"
Nummer: "{{paragrafNummer}}"
Tekst:
---
{{{paragrafTekst}}}
---

**JURIDISK KONTEKST (Hovedlov & Vejledninger):**
---
{{{lovtekst}}}
---

**Dine opgaver (på dansk):**
Udfyld et JSON-objekt med følgende tre felter:
1.  **kerneindhold**: Opsummér paragraffens vigtigste juridiske pointer i et letforståeligt sprog. Hvad siger reglen helt præcist?
2.  **betydningForPraksis**: Forklar hvad paragraffen betyder for en socialrådgivers daglige arbejde. Brug information fra vejledningerne til at give konkrete, fiktive eksempler på anvendelse.
3.  **forholdTilAndreParagraffer**: Beskriv hvordan paragraffen hænger sammen med andre centrale regler i den medsendte kontekst (f.eks. forbindelsen mellem en ydelsesparagraf og formålsbestemmelsen).

Alt output skal være på dansk.`,
  config: {
    safetySettings: [
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_LOW_AND_ABOVE' },
    ],
  },
});

const explainLawParagraphFlow = ai.defineFlow(
  {
    name: 'explainLawParagraphFlow',
    inputSchema: ExplainLawParagraphInputSchema,
    outputSchema: ExplainLawParagraphOutputSchema,
  },
  async (input) => {
    const { output, usage } = await prompt(input);
    return {
      data: output!,
      usage: {
        inputTokens: usage.inputTokens,
        outputTokens: usage.outputTokens
      }
    };
  }
);
