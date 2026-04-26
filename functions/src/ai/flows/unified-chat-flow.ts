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
  social_work: `Du er en ekspert i socialfaglige teorier, metoder og etik. Du hjælper med at koble teori på praksis og reflektere over professionens værdier. Du kender pensummet på socialrådgiveruddannelsen indgående.`,
  academic: `Du er en akademisk vejleder for socialrådgiverstuderende. Du hjælper med at uddybe komplekse begreber, koble dem til videnskabsteori og pensum, og forberede den studerende til eksamen. Du svarer præcist, fagligt og med et højt abstraktionsniveau, men stadig pædagogisk.`
};


export const unifiedChatFlow = ai.defineFlow(
  {
    name: 'unifiedChatFlow',
    inputSchema: UnifiedChatInputSchema,
    outputSchema: UnifiedChatOutputSchema,
  },
  async (input, { sendChunk }) => {
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

    const chatPrompt = ai.definePrompt({
      name: 'unifiedChatPrompt',
      input: { schema: UnifiedChatInputSchema },
      output: { schema: UnifiedChatDataSchema },
      model: 'googleai/gemini-1.5-flash',
      prompt: `
${personaDescription}

**Kontekst:**
${contextInfo}

**Chat Historik:**
${(input.chatHistory && input.chatHistory.length > 0)
  ? input.chatHistory.map(h => `- ${h.role}: ${h.content}`).join('\n')
  : 'Ingen tidligere historik.'}

**Brugerens besked:**
{{message}}

**Din opgave:**
Besvar brugerens besked på en måde, der passer til din persona. 
Hvis du er i 'legal' persona, skal du prioritere lovhenvisninger. 
Hvis du er i 'case' persona, skal du fokusere på den konkrete situation.

Returner dit svar i et JSON-objekt med feltet 'answer'. 
Brug Markdown til at skabe en flot struktur:
- Brug overskrifter (##, ###) til at dele svaret op.
- Brug punktopstillinger til lister.
- Brug **fed skrift** til vigtige pointer.
- Brug > til citater eller lovhenvisninger.

**VIGTIGT:** Du skal ALTID bruge dobbelte linjeskift (\n\n) før overskrifter og mellem afsnit. Uden dobbelte linjeskift virker formateringen ikke.
    
**VIGTIGT:** Du må IKKE bruge din generelle viden om jura til at rådgive. ALT jura skal være baseret på den leverede kontekst fra Lovportalen. Hvis du mangler specifik lovhjemmel i konteksten, skal du sige det direkte fremfor at gætte.
    
Svaret SKAL være på dansk.`,
      config: { temperature: 0.1 }
    });

    const streamRes = await chatPrompt.stream(input);

    for await (const chunk of streamRes.stream) {
      if (chunk.output) {
        sendChunk(chunk.output);
      }
    }

    const finalRes = await streamRes.response;

    return {
      data: finalRes.output!,
      usage: {
        inputTokens: finalRes.usage.inputTokens || 0,
        outputTokens: finalRes.usage.outputTokens || 0,
      },
    };
  }
);
