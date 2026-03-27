// @ts-nocheck
import { ai } from '@/ai/genkit';
import { 
    SeminarChatInputSchema, 
    SeminarChatDataSchema, 
    SeminarChatOutputSchema, 
    type SeminarChatInput, 
    type SeminarChatOutput 
} from './types';

export async function seminarChat(input: SeminarChatInput): Promise<SeminarChatOutput> {
  return seminarChatFlow(input);
}

const seminarChatPrompt = ai.definePrompt({
  name: 'seminarChatPrompt',
  input: { schema: SeminarChatInputSchema },
  output: { schema: SeminarChatDataSchema },
  prompt: `Du er en ekspert i socialfaglig vejledning og akademisk assistance for socialrådgiverstuderende.
Din opgave er at besvare brugerens spørgsmål baseret på indholdet af deres analyserede seminarer (PowerPoints/PDF'er).

**Seminar Kontekst:**
{{#each seminars}}
---
**Titel:** {{this.title}}
**Slides:**
{{#each this.slides}}
- Slide {{this.slideNumber}} ({{this.slideTitle}}): {{{this.summary}}}
{{/each}}
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
1. Svar pædagogisk og fagligt funderet på dansk.
2. Brug seminarerne som din primære kilde. Henvis gerne til specifikke slides hvis muligt (f.eks. "Som nævnt på slide 4 i '{{seminars.[0].title}}'...").
3. Hvis svaret ikke findes direkte i materialet, må du gerne bruge din generelle viden som socialfaglig ekspert, men gør det tydeligt hvad der er fra materialet og hvad der er supplerende viden.
4. Strukturér dit svar med HTML-tags som \`<p>\`, \`<strong>\`, og \`<ul>/<li>\` for at gøre det letlæseligt.
5. Giv 2-3 korte forslag til opfølgende spørgsmål, som brugeren kunne stille for at uddybe emnet.

Dit svar skal være et JSON-objekt der matcher det forespurgte schema.`,
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

const seminarChatFlow = ai.defineFlow(
  {
    name: 'seminarChatFlow',
    inputSchema: SeminarChatInputSchema,
    outputSchema: SeminarChatOutputSchema,
  },
  async (input) => {
    const { output, usage } = await seminarChatPrompt(input);
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
