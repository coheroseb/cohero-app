// @ts-nocheck
import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const CaseSchema = z.object({
  id: z.string(),
  title: z.string(),
  topic: z.string(),
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

const SimulateFeedbackInputSchema = z.object({
  cases: z.array(CaseSchema),
  inbox: z.array(InboxEventSchema),
  userJournals: z.record(z.string(), z.string()).describe("A map from case ID to the user's final journal text."),
  totalDays: z.number().describe("The number of days the simulation lasted."),
  userName: z.string().describe("The name of the user.")
});

const SimulateFeedbackOutputSchema = z.object({
  overallScore: z.number().min(0).max(10).describe("Overall performance score from 0 to 10."),
  timeManagementScore: z.number().min(0).max(10),
  synthesisScore: z.number().min(0).max(10),
  generalFeedback: z.string().describe("A professional text summary of the user's performance. Focus on prioritization and journal quality."),
  caseSpecificFeedback: z.array(z.object({
      caseId: z.string(),
      feedbackText: z.string().describe("Specific feedback for this case based on the events and the final journal.")
  })).describe("Feedback per case.")
});

const prompt = ai.definePrompt({
    name: 'simulateFeedbackPrompt',
    input: { schema: SimulateFeedbackInputSchema },
    output: { schema: SimulateFeedbackOutputSchema },
    prompt: `Du er censor og 'Game Master' for Sags-simulatoren. Socialrådgiveren {{{userName}}} har netop afsluttet en simulation, der varede i {{{totalDays}}} dage.

Her er de sager, de håndterede:
{{#each cases}}
- {{@index}}: {{this.id}} ({{this.topic}})
{{/each}}

Her er hele den historiske indbakke (kronologisk):
{{#each inbox}}
- [{{this.date}}] Til: {{this.relatedCaseId}} | Fra: {{this.sender}} | {{this.title}} -> {{this.content}}
{{/each}}

Her er brugerens ({{{userName}}}'s) endelige journalnotater for hver sag:
{{#each userJournals}}
Sag: {{@key}}
Journal: {{this}}
{{/each}}

Din opgave er at evaluere {{{userName}}}. Vær streng og professionel.
1. Syntetiserede {{{userName}}} informationerne godt i journalerne?
2. Reagerede de rettidigt på de mest kritiske/etiske dilemmaer (f.eks. tvang, underretninger) i indbakken? (Tidsstyring og prioritering).
3. Hvad mangler der juridisk eller fagligt? Blev vigtig lovgivning ignoreret?

Giv konkrete karakterer og specifik formateret feedback direkte stilet til {{{userName}}}.`
});

export const simulateFeedbackFlow = ai.defineFlow(
    {
        name: 'simulateFeedbackFlow',
        inputSchema: SimulateFeedbackInputSchema,
        outputSchema: z.object({
            data: SimulateFeedbackOutputSchema,
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
