import { ai } from '@/ai/genkit';
import { z } from 'zod';

const CaseSchema = z.object({
  id: z.string(),
  title: z.string(),
  topic: z.string(),
  description: z.string(),
});

const InboxEventSchema = z.object({
  id: z.string(),
  relatedCaseId: z.string(),
  type: z.enum(['email', 'phone', 'note', 'sms']),
  sender: z.string(),
  date: z.string(),
  title: z.string(),
  content: z.string(),
});

const SimulateNextDayInputSchema = z.object({
  cases: z.array(CaseSchema).describe("The active cases in the simulation."),
  previousInbox: z.array(InboxEventSchema).describe("All previously received inbox events."),
  userJournals: z.record(z.string(), z.string()).describe("A map from case ID to the user's current journal text. E.g. { 'CASE-1A': 'Har talt med mor...' }"),
  currentDay: z.number().describe("The new day number we are jumping to (e.g., 2)."),
  daysPassed: z.number().describe("Number of days passed since last login."),
  userName: z.string().describe("The name of the user."),
  newDateStr: z.string().describe("Real exact date string right now.")
});

const SimulateNextDayOutputSchema = z.object({
  newEvents: z.array(InboxEventSchema).describe("Generate 2-4 appropriate new messages representing developments in the cases."),
});

const prompt = ai.definePrompt({
    name: 'simulateNextDayPrompt',
    input: { schema: SimulateNextDayInputSchema },
    output: { schema: SimulateNextDayOutputSchema },
    prompt: `Du er 'Game Master' for Sags-simulatoren. En socialrådgiver ved navn {{{userName}}} logger ind.
Der er gået {{{daysPassed}}} dag(e) siden {{{userName}}} sidst var her. I dag er simulationens Dag {{{currentDay}}}, og den Rigtige Dato i dag er: {{{newDateStr}}}.
    
Aktive Sager:
{{#each cases}}
- ID: {{this.id}} | {{this.title}} ({{this.topic}})
{{/each}}

Brugerens ({{{userName}}}'s) journalnotater pr. sag (hvad de har gjort/besluttet so far):
{{#each userJournals}}
- Sag ID: {{@key}} 
  Journal: {{this}}
{{/each}}
(Bemærk: Hvis en journal er tom eller mangelfuld, har {{{userName}}} reelt ikke handlet på sagen!)

Opgave:
Ud fra hvad {{{userName}}} HAR journaliseret, og især hvad der ligger i Indbakken (inklusiv direkte e-mail-svar fra {{{userName}}}), skal du generere 2-4 nye hændelser (emails, indgående opkald, sms'er). 

VIGTIGT: Læs indbakken! Hvis der ligger en e-mail i indbakken, hvor sender er "{{{userName}}}" (brugeren har trykket "besvar"), SKAL DU LADE MODPARTEN REAGERE på dette svar! Hvis brugeren tværtimod ignorerer folks opkald/mails, skal de blive frustrerede.

Udfordr vitterligt {{{userName}}}! Hvis der mangler lovpligtige handlinger (f.eks. partshøring ikke nævnt) SKAL DER SKE ESKALERING (f.eks. Ankestyrelsen klager, politiet ringer m.v.).
Hvis der er gået flere dage ({{{daysPassed}}} > 1), og der ikke er journaliseret handlinger for de forgangne dage, forventes massiv utålmodighed ("Kære {{{userName}}}, jeg har ventet længe på svar!").
Hændelserne skal inkorporere høj faglig, etisk eller juridisk kompleksitet.
Dater de nye beskeder troværdigt vha. aktuel dato: "{{{newDateStr}}} kl. XX:XX". Giv dem nye (unikke) ID'er.`
});

export const simulateNextDayFlow = ai.defineFlow(
    {
        name: 'simulateNextDayFlow',
        inputSchema: SimulateNextDayInputSchema,
        outputSchema: z.object({
            data: SimulateNextDayOutputSchema,
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
