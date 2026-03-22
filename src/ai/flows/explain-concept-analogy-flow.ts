
/**
 * @fileOverview An AI flow to explain a social work concept using an analogy.
 * - explainConceptWithAnalogy - Generates a new explanation for a concept.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const ExplainConceptAnalogyInputSchema = z.object({
  conceptName: z.string().describe('The title of the social work concept.'),
  definition: z.string().describe('The existing definition of the concept.'),
});
export type ExplainConceptAnalogyInput = z.infer<typeof ExplainConceptAnalogyInputSchema>;

const ExplainConceptAnalogyDataSchema = z.object({
  analogy: z.string().describe('A new explanation of the item using simple, relatable analogies in an HTML list format.'),
});

const ExplainConceptAnalogyOutputSchema = z.object({
  data: ExplainConceptAnalogyDataSchema,
  usage: z.object({
    inputTokens: z.number(),
    outputTokens: z.number(),
  }),
});
export type ExplainConceptAnalogyOutput = z.infer<typeof ExplainConceptAnalogyOutputSchema>;

export async function explainConceptWithAnalogy(input: ExplainConceptAnalogyInput): Promise<ExplainConceptAnalogyOutput> {
  return explainConceptAnalogyFlow(input);
}

const prompt = ai.definePrompt({
  name: 'explainConceptAnalogyPrompt',
  input: { schema: ExplainConceptAnalogyInputSchema },
  output: { schema: ExplainConceptAnalogyDataSchema },
  prompt: `You are a creative teacher who excels at explaining complex ideas with simple, powerful analogies.
Your task is to break down the social work concept below and explain it using very short, relatable analogies in an HTML list.

The concept is: "{{{conceptName}}}"
The current definition is:
"{{{definition}}}"

**Instructions for your response:**
- **DO NOT** write long, connected paragraphs.
- **USE** simple language and powerful, everyday analogies.
- **FORMAT** your response as a valid HTML unordered list (\`<ul>\`). Each list item must be wrapped in \`<li>\` tags.
- **USE ONLY HTML TAGS** for formatting (e.g., \`<b>\` for bold). **DO NOT use any markdown syntax** like \`*\`, \`#\`, or \`**\`.
- All output **MUST** be in Danish.

Your response MUST be a JSON object with a single key, "analogy", containing the HTML string.

**Example for 'Anerkendelse':**
\`\`\`json
{
  "analogy": "<ul><li><b>Tænk på det som at spejle en person:</b> Du viser, at du ser og hører præcis, hvad de udtrykker, uden at ændre billedet.</li><li><b>Det er som at give en nøgle:</b> Du giver borgeren nøglen til sin egen fortælling og validerer, at den er 'rigtig' for dem.</li><li><b>Som en god rejseguide:</b> Du følger borgerens rute og tempo i stedet for at trække dem over på din egen sti.</li></ul>"
}
\`\`\`
`,
});

const explainConceptAnalogyFlow = ai.defineFlow(
  {
    name: 'explainConceptAnalogyFlow',
    inputSchema: ExplainConceptAnalogyInputSchema,
    outputSchema: ExplainConceptAnalogyOutputSchema,
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
