'use client';

/**
 * @fileOverview An AI flow to generate viral TikTok scripts for Cohéro.
 */

import { ai } from '@/ai/genkit';
import { 
    TikTokScriptInputSchema,
    TikTokScriptOutputSchema,
} from './types';

const prompt = ai.definePrompt({
  name: 'tiktokScriptPrompt',
  input: { schema: TikTokScriptInputSchema },
  prompt: `Du er en kreativ marketing-ekspert for Cohéro (en platform for socialrådgiverstuderende).
Din mission er at skrive 3 virale TikTok-scripts baseret på emnet: {{topic}} (eller dagens vigtigste legal-topic hvis intet er angivet).

**Målet:** {{goal}}
**Tonen:** {{tone}}

Hvert script skal følge TikTok's "Winning Formula":
1. **The Hook (0-3 sek):** Skal stoppe folk i at scrolle. Vær provokerende, nysgerrig eller løsningsorienteret.
2. **The Body (15-40 sek):** Giv lynhurtig værdi. Gør det faktuelt korrekt (socialrådgiver-relevant) men hold det simpelt.
3. **The CTA (Sidste 3 sek):** Hvad skal de gøre nu? (Tjek portalen, bliv Kollega+, læs mere i bio).

Hvert script skal have en god 'Caption' med relevante hashtags (som #socialrådgiver #cohero #jurastudie).

Returner en liste af 3 objekter i JSON format.
`,
});

export const tiktokScriptFlow = ai.defineFlow(
  {
    name: 'tiktokScriptFlow',
    inputSchema: TikTokScriptInputSchema,
    outputSchema: TikTokScriptOutputSchema,
  },
  async (input) => {
    const { output, usage } = await prompt(input);
    return {
      data: output as any,
      usage: {
        inputTokens: usage.inputTokens || 0,
        outputTokens: usage.outputTokens || 0
      }
    };
  }
);
