// @ts-nocheck
import { ai } from '@/ai/genkit';
import { z } from 'genkit';


const CaseSchema = z.object({
  id: z.string().describe("A unique 5-6 character string (e.g., 'CASE-1A')."),
  title: z.string().describe("A professional sounding short title for the case."),
  topic: z.string().describe("The relevant area, e.g. 'Børn og Unge', 'Beskæftigelse', 'Rusmiddel'"),
  description: z.string().describe("An internal short summary of the basic facts known so far."),
});

const InboxEventSchema = z.object({
  id: z.string().describe("Unique ID for the message."),
  relatedCaseId: z.string().describe("Must match the id of one of the generated cases."),
  type: z.enum(['email', 'phone', 'note', 'sms']).describe("Type of correspondence."),
  sender: z.string().describe("The name or title of the sender (e.g., 'Skoleleder Hanne', 'Borgeren', 'Politi')."),
  date: z.string().describe("E.g., 'Dag 1, kl. 09:15'."),
  title: z.string().describe("Subject/title of the message."),
  content: z.string().describe("The actual content of the message. Should be realistic, somewhat messy, subjective or bureaucratic. Use plain text or simple HTML like <br>."),
});

const SimulateStartOutputSchema = z.object({
  cases: z.array(CaseSchema).length(3).describe("Generate exactly 3 different active cases."),
  inbox: z.array(InboxEventSchema).describe("Generate 3-5 initial messages across the 3 cases for Day 1."),
});

const SimulateStartInputSchema = z.object({
    theme: z.string().describe("The general theme or focus for this simulation round (e.g. 'Blandet', 'Udsatte Børn')."),
    lawContext: z.string().optional().describe("Background legal context if relevant."),
    userName: z.string().describe("The name of the user playing the simulation."),
    currentDateStr: z.string().describe("E.g. 'mandag den 22. marts 2026'")
});

const prompt = ai.definePrompt({
    name: 'simulateStartPrompt',
    input: { schema: SimulateStartInputSchema },
    output: { schema: SimulateStartOutputSchema },
    prompt: `Du er en avanceret fagsystem-generator, og du er 'Game Master' for Sags-simulatoren. Spilleren ("Socialrådgiveren") hedder {{{userName}}}. 
Din opgave er at generere START-TILSTANDEN for simulationen.

Tema for simulationen: {{{theme}}}
Relevant jura baggrund (valgfrit): {{{lawContext}}}

Opret præcis 3 unikke og yderst realistiske sager indenfor dansk socialrådgivning. Sagerne skal have ET HØJT NIVEAU AF KOMPLEKSITET. Sørg for at integrere svære sværgange (f.eks. tvangsanbringelser vs. forældresamarbejde, stramme lovpligtige frister, psykiatri, ressourcemangel, eller uklare underretninger).
For disse 3 sager genererer du de indledende indbakke-beskeder (3-5 i alt) for starten på simulationen.
Den rigtige aktuelle dato lige nu er: {{{currentDateStr}}}. Dater beskedernes felt 'date' realistisk (f.eks. "{{{currentDateStr}}} kl. 08:15" eller "I går kl. 14:30").
Beskederne skal være "rå data" - dvs. e-mails, telefonnotater osv. Nogle afspendere MÅ MEGET GERNE henvende sig direkte til "{{userName}}". Gør dem frustrerede, udokumenterede eller modsigende, ligesom den virkelige verden. Husk at knytte dem til de rigtige case ID'er.`
});

export const simulateStartFlow = ai.defineFlow(
    {
        name: 'simulateStartFlow',
        inputSchema: SimulateStartInputSchema,
        outputSchema: z.object({
            data: SimulateStartOutputSchema,
            usage: z.object({
                inputTokens: z.number(),
                outputTokens: z.number(),
            })
        }),
    },
    async (input) => {
        const { output, usage } = await prompt(input);
        return {
            data: output!,
            usage: {
                inputTokens: usage.inputTokens || 0,
                outputTokens: usage.outputTokens || 0
            }
        };
    }
);
