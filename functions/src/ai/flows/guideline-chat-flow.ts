// @ts-nocheck
import { ai } from '@/ai/genkit';
import { 
    GuidelineChatInputSchema, 
    GuidelineChatDataSchema, 
    GuidelineChatOutputSchema, 
    type GuidelineChatInput, 
    type GuidelineChatOutput 
} from './types';

export async function chatWithGuidelineContent(input: GuidelineChatInput): Promise<GuidelineChatOutput> {
  return guidelineChatFlow(input);
}

const guidelineChatPrompt = ai.definePrompt({
  name: 'guidelineChatPrompt',
  input: { schema: GuidelineChatInputSchema },
  output: { schema: GuidelineChatDataSchema },
  prompt: `Du er en ekspert i dansk socialret og lovgivning. Din opgave er at hjælpe brugeren med at forstå en specifik vejledning og dens sammenhæng med den tilhørende lov.

**Kontekst:**
{{#if lawContext}}
### Overordnet Lovtekst
{{{lawContext}}}
{{/if}}

### Vejledninger
{{#each guidelineContexts}}
---
**Titel:** {{this.title}}
**Indhold:**
{{{this.content}}}
---
{{/each}}

**Chat Historik:**
{{#if chatHistory}}
    {{#each chatHistory}}
    {{role}}: {{content}}
    {{/each}}
{{else}}
    Ingen tidligere historik.
{{/if}}

**Brugerens Spørgsmål:**
"{{{question}}}"

**Instruktioner:**
1. Svar pædagogisk og præcist på dansk.
2. Du SKAL aktivt henvise til præcis hvor i vejledningen (kapitel, afsnit eller citat), man kan læse mere om emnet.
3. Brug din viden om loven til at forklare, hvordan vejledningen fortolker lovens paragraffer.
4. **STRENGT FORBUDT:** Du må IKKE bruge din træningsviden til at besvare juridiske spørgsmål. ALT jura skal findes i de leverede {{{lawContext}}} og {{{guidelineContexts}}}. Hvis du ikke kan finde et direkte svar i den medsendte tekst, skal du svare præcis følgende: "Jeg kan ikke finde et entydigt juridisk svar på dette i den nuværende kontekst fra Lovportalen. Prøv at søge efter specifikke paragraffer eller emner i Lovportalen."
5. Du skal altid prioritere lovteksten (paragraffer) over vejledningsteksten, hvis der er uoverensstemmelse.
6. Strukturér dit svar med HTML-tags som `<p>`, `<strong>`, og `<ul>/<li>` for at gøre det læsevenligt.
7. Foreslå 2-3 korte opfølgende spørgsmål, som brugeren kan stille for at dykke dybere ned i materialet.
8. Hvis {{{lawContext}}} er tom eller mangelfuld, skal du informere brugeren om, at du ikke har adgang til de relevante love for at svare korrekt.

Dit svar skal være et JSON-objekt, der matcher det ønskede schema.`,
  config: {
    temperature: 0.7,
    safetySettings: [
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_LOW_AND_ABOVE' },
    ],
  },
});

export const guidelineChatFlow = ai.defineFlow(
  {
    name: 'guidelineChatFlow',
    inputSchema: GuidelineChatInputSchema,
    outputSchema: GuidelineChatOutputSchema,
  },
  async (input) => {
    const { output, usage } = await guidelineChatPrompt(input);
    if (!output) throw new Error("AI returnerede intet svar.");
    return {
      data: output,
      usage: {
        inputTokens: usage?.inputTokens || 0,
        outputTokens: usage?.outputTokens || 0,
      },
    };
  }
);
