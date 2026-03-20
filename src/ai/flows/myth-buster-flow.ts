'use server';
/**
 * @fileOverview An AI flow to bust common myths about social work.
 * - getMythBusterResponse - Provides a nuanced explanation for a selected myth.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const MythBusterInputSchema = z.object({
  mythId: z.enum(['fjerner-boern', 'papirarbejde', 'overmenneske']).describe("The ID of the myth to bust."),
});
export type MythBusterInput = z.infer<typeof MythBusterInputSchema>;

const MythBusterDataSchema = z.object({
  busted: z.string().describe("The myth that is being addressed."),
  reality: z.string().describe("A nuanced explanation of the reality behind the myth."),
});

const MythBusterOutputSchema = z.object({
  data: MythBusterDataSchema,
  usage: z.object({
    inputTokens: z.number(),
    outputTokens: z.number(),
  }),
});
export type MythBusterOutput = z.infer<typeof MythBusterOutputSchema>;

export async function getMythBusterResponse(input: MythBusterInput): Promise<MythBusterOutput> {
    return mythBusterFlow(input);
}

const prompt = ai.definePrompt({
  name: 'mythBusterPrompt',
  input: { schema: MythBusterInputSchema },
  output: { schema: MythBusterDataSchema },
  prompt: `You are a social work educator providing a nuanced explanation to a prospective student about a common myth. Your tone is realistic but also highlights the professionalism of the field.

The user selected the myth with ID: '{{{mythId}}}'.

Based on the ID, provide a response in Danish with two parts: 'busted' (the myth itself) and 'reality' (the explanation).

*   If 'fjerner-boern':
    *   **busted:** "En socialrådgiver kan bare fjerne børn."
    *   **reality:** "Virkeligheden er, at en anbringelse er den absolut sidste udvej og kræver grundige undersøgelser og en afgørelse i et udvalg med en dommer. Målet er altid at hjælpe familien til at kunne varetage omsorgen selv, jf. Barnets Lov. Det er en alvorlig og dybt reguleret proces."

*   If 'papirarbejde':
    *   **busted:** "Socialt arbejde er kun papirnusseri og administration."
    *   **reality:** "Dokumentation er afgørende for borgerens retssikkerhed og for at sikre en faglig, velbegrundet indsats. Men det er et redskab – ikke målet. Kernen i faget er stadig den relationelle kontakt med borgeren, og den gode socialrådgiver balancerer begge dele."

*   If 'overmenneske':
    *   **busted:** "Man skal være et overmenneske for at være socialrådgiver."
    *   **reality:** "Man skal ikke være et overmenneske, men man skal være et helt menneske, der tør være i det svære. Uddannelsen handler netop om at give dig de faglige metoder, den juridiske viden og den personlige robusthed, det kræver at håndtere komplekse sager professionelt."

Your response must be a single JSON object.`,
});

const mythBusterFlow = ai.defineFlow(
  {
    name: 'mythBusterFlow',
    inputSchema: MythBusterInputSchema,
    outputSchema: MythBusterOutputSchema,
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
