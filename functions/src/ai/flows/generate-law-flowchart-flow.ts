// @ts-nocheck

/**
 * @fileOverview An AI flow to generate an interactive flowchart for complex legal paragraphs.
 */

import { ai } from '@/ai/genkit';
import {
  GenerateLawFlowchartInputSchema,
  LawFlowchartDataSchema,
  GenerateLawFlowchartOutputSchema,
  type GenerateLawFlowchartOutput,
} from './types';

export async function generateLawFlowchart(input: any): Promise<GenerateLawFlowchartOutput> {
  return generateLawFlowchartFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateLawFlowchartPrompt',
  input: { schema: GenerateLawFlowchartInputSchema },
  output: { schema: LawFlowchartDataSchema },
  prompt: `Du er en ekspert i dansk socialret og pædagogisk procesformidling. Din opgave er at transformere en kompleks juridisk paragraf til et logisk, letforståeligt flowchart.
    
    **MÅLGRUPPE:** Socialrådgivere der har brug for hurtigt overblik over en proces eller beslutningsvej.

    **REGLER FOR INDHOLD:**
    1. **Sprog:** Brug et letlæseligt dansk. Undgå unødvendigt juridisk "kancellisprog".
    2. **Fokus:** Identificer de "objektive betingelser" i teksten. Hvad skal være opfyldt?
    3. **Action-orienteret:** Labels skal være korte (max 8-10 ord). Brug gerne spørgsmålstegn ved beslutninger.
    4. **Struktur:** Start altid med en 'start' node og slut med 'action' (resultat) eller 'end'.

    **Kontekst:**
    Lov: "{{{lovTitel}}}"
    Paragraf: "{{{paragrafNummer}}}"
    Tekst: 
    ---
    {{{paragrafTekst}}}
    ---

    {{#if fuldLovtekst}}
    **Supplerende Lovtekst/Kontekst:**
    {{{fuldLovtekst}}}
    {{/if}}

    **Formatkrav:**
    1. **Nodes:**
        - \`id\`: unik streng.
        - \`label\`: Ultrakort tekst (f.eks. "Er der samtykke?").
        - \`type\`: 'start', 'decision', 'action', 'end'.
        - \`description\`: VIGTIGT: Hvis boksen refererer til en specifik paragraf (f.eks. § 54), skal du her inkludere selve indholdet af den paragraf (eller de vigtigste dele) fra din viden eller den medsendte tekst, så brugeren kan læse den med det samme uden at slå op.
    2. **Edges:**
        - \`from\`, \`to\`.
        - \`label\`: Meget kort (f.eks. "Ja", "Nej", "Hvis nej").


    Dit svar SKAL være et JSON-objekt, der matcher output-skemaet.`,
  config: {
    temperature: 0.2,
    safetySettings: [
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
    ],
  },
});

const generateLawFlowchartFlow = ai.defineFlow(
  {
    name: 'generateLawFlowchartFlow',
    inputSchema: GenerateLawFlowchartInputSchema,
    outputSchema: GenerateLawFlowchartOutputSchema,
  },
  async (input) => {
    const { output, usage } = await prompt(input);
    
    if (!output) {
      throw new Error("AI failed to generate flowchart data.");
    }

    return {
      data: output,
      usage: {
        inputTokens: usage?.inputTokens || 0,
        outputTokens: usage?.outputTokens || 0,
      },
    };
  }
);
