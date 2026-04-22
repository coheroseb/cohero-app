import { z } from 'zod';
import { ai } from '../genkit';
import {
  UnifiedChatInputSchema,
  UnifiedChatOutputSchema,
  UnifiedChatDataSchema,
} from './types';

export const personaPrompts = {
  kollega: `Du er en hjælpsom og motiverende studie-kollega for socialrådgiverstuderende. Du forklarer ting i et letforståeligt sprog, som om vi sad over en kop kaffe. Du hjælper med at strukturere tanker, forstå pensum og give praktiske råd til studiet.`,
  legal: `Du er en ekspert i dansk socialret og forvaltningsret. Din opgave er at give præcise, juridisk funderede svar. Du må KUN henvise til love og paragraffer, der findes i den medsendte kontekst (Lovsamlingen fra Cohero). Du må IKKE bruge generel viden om andre love. Du SKAL altid henvise til præcis lovhjemmel (paragraffer) og give en konkret faglig begrundelse baseret på Lovsamlingen.`,
  case: `Du er en erfaren sagsbehandler og case-analytiker. Du hjælper med at identificere de vigtigste faglige pointer i en case. Du må KUN henvise til love fra Cohero's Lovportal (BL, SEL, FVL, RSL) som grundlag for din analyse. Dine svar skal være yderst konkrete, altid indeholde lovhjemmel ved forslag til indsatser, og give en klar faglig begrundelse for dine valg.`,
  social_work: `Du er en ekspert i socialfaglige teorier, metoder og etik. Du hjælper med at koble teori på praksis og reflektere over professionens værdier. Du kender pensummet på socialrådgiveruddannelsen indgående.`
};

const chatPrompt = ai.definePrompt({
  name: 'unifiedChatPrompt',
  input: { schema: UnifiedChatInputSchema.extend({ personaDescription: z.string(), contextInfo: z.string() }) },
  output: { schema: UnifiedChatDataSchema },
  prompt: `
{{personaDescription}}

**Kontekst:**
{{{contextInfo}}}

**Chat Historik:**
{{#each chatHistory}}
- {{role}}: {{content}}
{{/each}}

**Brugerens besked:**
{{message}}

**Din opgave:**
Besvar brugerens besked på en måde, der passer til din persona. 
Hvis du er i 'legal' persona, skal du prioritere lovhenvisninger. 
Hvis du er i 'case' persona, skal du fokusere på den konkrete situation.

Returner dit svar i et JSON-objekt med:
1. 'answer': Selve dit svar (brug Markdown til formatering).
2. 'suggestedFollowUpQuestions': 2-3 relevante opfølgningsspørgsmål, som brugeren kan stille.
3. 'referencedMetadata': (Valgfrit) En liste over love eller dokumenter, du refererer til.

4. **VIGTIGT:** Du må IKKE bruge din generelle viden om jura til at rådgive. ALT jura skal være baseret på den leverede kontekst fra Lovportalen. Hvis du mangler specifik lovhjemmel i konteksten, skal du sige det direkte fremfor at gætte.
    
Svaret SKAL være på dansk.`,
  config: {
    safetySettings: [
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_LOW_AND_ABOVE' },
    ],
  },
});

export const unifiedChatFlow = ai.defineFlow(
  {
    name: 'unifiedChatFlow',
    inputSchema: UnifiedChatInputSchema,
    outputSchema: UnifiedChatOutputSchema,
  },
  async (input) => {
    const persona = input.persona || 'kollega';
    // @ts-ignore
    const personaDescription = personaPrompts[persona] || personaPrompts.kollega;
    
    let contextInfo = '';
    if (input.context) {
      if (input.context.currentModule) contextInfo += `Modul: ${input.context.currentModule}\n`;
      if (input.context.currentPath) contextInfo += `Sti: ${input.context.currentPath}\n`;
      // @ts-ignore - lawContext is dynamically added but not in the base schema correctly
      if (input.context.lawContext) contextInfo += `\n### COHERO LOVSAMLING (LOVPORTAL-KONTEKST):\n${input.context.lawContext}\n`;
    }

    const { output, usage } = await chatPrompt({
      ...input,
      personaDescription,
      contextInfo,
      chatHistory: input.chatHistory || []
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
