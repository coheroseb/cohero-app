// @ts-nocheck

/**
 * @fileOverview An AI flow to explain a study technique or concept using an analogy.
 * - explainTechniqueWithAnalogy - Generates a new explanation for a technique or concept.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ExplainTechniqueAnalogyInputSchema = z.object({
  title: z.string().describe('The title of the study technique or concept.'),
  content: z.string().describe('The existing description of the study technique or concept.'),
});
export type ExplainTechniqueAnalogyInput = z.infer<typeof ExplainTechniqueAnalogyInputSchema>;

const ExplainTechniqueAnalogyDataSchema = z.object({
  analogy: z.string().describe('A new explanation of the item using simple, relatable analogies in an HTML list format.'),
});

const ExplainTechniqueAnalogyOutputSchema = z.object({
  data: ExplainTechniqueAnalogyDataSchema,
  usage: z.object({
    inputTokens: z.number(),
    outputTokens: z.number(),
  }),
});
export type ExplainTechniqueAnalogyOutput = z.infer<typeof ExplainTechniqueAnalogyOutputSchema>;

export async function explainTechniqueWithAnalogy(input: ExplainTechniqueAnalogyInput): Promise<ExplainTechniqueAnalogyOutput> {
  return explainTechniqueAnalogyFlow(input);
}

const prompt = ai.definePrompt({
  name: 'explainTechniqueAnalogyPrompt',
  input: { schema: ExplainTechniqueAnalogyInputSchema },
  output: { schema: ExplainTechniqueAnalogyDataSchema },
  prompt: `You are a creative teacher who excels at explaining complex ideas with simple, powerful analogies.
Your task is to break down the study technique or concept below and explain it using very short, relatable analogies in an HTML list.

The item is called: "{{{title}}}"
The current explanation is:
"{{{content}}}"

**Instructions for your response:**
- **DO NOT** write long, connected paragraphs.
- **USE** simple language and powerful, everyday analogies.
- **FORMAT** your response as a valid HTML unordered list (\`<ul>\`). Each list item must be wrapped in \`<li>\` tags.
- **USE ONLY HTML TAGS** for formatting (e.g., \`<b>\` for bold). **DO NOT use any markdown syntax** like \`*\`, \`#\`, or \`**\`.
- All output **MUST** be in Danish.

Your response MUST be a JSON object with a single key, "analogy", containing the HTML string.

**Example for 'Selektiv læsning':**
\`\`\`json
{
  "analogy": "<ul><li><b>Tænk på det som at gå på svampejagt:</b> Du leder kun efter kantareller, ikke alle svampe.</li><li><b>Det er som at bruge en overstregningstuds:</b> Du markerer kun det absolut vigtigste.</li><li><b>Som at skimme en film for at finde en bestemt scene:</b> Du spoler hurtigt forbi alt det, der ikke er relevant.</li></ul>"
}
\`\`\`
`,
});

const explainTechniqueAnalogyFlow = ai.defineFlow(
  {
    name: 'explainTechniqueAnalogyFlow',
    inputSchema: ExplainTechniqueAnalogyInputSchema,
    outputSchema: ExplainTechniqueAnalogyOutputSchema,
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
