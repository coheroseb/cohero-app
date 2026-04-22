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
  // Calling the flow function directly here
  return guidelineChatFlow(input);
}

export const guidelineChatFlow = ai.defineFlow(
  {
    name: 'guidelineChatFlow',
    inputSchema: GuidelineChatInputSchema,
    outputSchema: GuidelineChatOutputSchema,
  },
  async (input) => {
    const { output, usage } = await ai.generate({
      prompt: `Du er en ekspert i dansk socialret og lovgivning. Din opgave er at hjælpe brugeren med at forstå en specifik vejledning og dens sammenhæng med den tilhørende lov.

**Kontekst:**
${input.lawContext ? `### Overordnet Lovtekst\n${input.lawContext}\n` : ''}

### Vejledninger
${input.guidelineContexts.map(g => `---\n**Titel:** ${g.title}\n**Indhold:**\n${g.content}\n---`).join('\n')}

**Chat Historik:**
${(input.chatHistory && input.chatHistory.length > 0) 
  ? input.chatHistory.map(h => `${h.role}: ${h.content}`).join('\n')
  : 'Ingen tidligere historik.'}

**Brugerens Spørgsmål:**
"${input.question}"

**Instruktioner:**
1. Svar pædagogisk og præcist på dansk.
2. Du SKAL aktivt henvise til præcis hvor i vejledningen (kapitel, afsnit eller citat), man kan læse mere om emnet.
3. Brug din viden om loven til at forklare, hvordan vejledningen fortolker lovens paragraffer.
4. **STRENGT FORBUDT:** Du må IKKE bruge din træningsviden til at besvare juridiske spørgsmål. ALT jura skal findes i de leverede kontekster. Hvis du ikke kan finde et direkte svar i den medsendte tekst, skal du svare præcis følgende: "Jeg kan ikke finde et entydigt juridisk svar på dette i den nuværende kontekst fra Lovportalen. Prøv at søge efter specifikke paragraffer eller emner i Lovportalen."
5. Du skal altid prioritere lovteksten (paragraffer) over vejledningsteksten, hvis der er uoverensstemmelse.
6. Strukturér dit svar med HTML-tags som <p>, <strong>, og <ul>/<li> for at gøre det læsevenligt.
7. Foreslå 2-3 korte opfølgende spørgsmål, som brugeren kan stille for at dykke dybere ned i materialet.
8. Hvis du ikke har adgang til relevante love, skal du informere brugeren om det.`,
      output: { schema: GuidelineChatDataSchema },
      config: { temperature: 0.7 }
    });
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
