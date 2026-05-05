

/**
 * @fileOverview An AI flow to generate a strategic admin insight report.
 */

import { ai } from '@/ai/genkit';
import { 
    AdminInsightInputSchema,
    AdminInsightOutputSchema,
} from './types';

const prompt = ai.definePrompt({
  name: 'adminInsightPrompt',
  input: { schema: AdminInsightInputSchema },
  prompt: `Du er en analytisk strategisk rådgiver for Cohéro. 
Her er ugens platform-statistikker til Sebastian (admin):

- Total brugere: {{totalUsers}} (Vækst: {{growth}}%)
- Aktive i dag (DAU): {{dau}}
- Aktive månedligt (MAU): {{mau}}
- Engagement (Stickiness): {{stickiness}}%
- Månedlig Churn Rate: {{churnRate30d}}%
- AI Omkostninger (denne mdr): {{monthlyTokenCost}} kr.
- Brugere i høj Churn-risiko: {{riskUsersCount}}
- Potentielt MRR tab: {{totalRiskMRR}} kr.
- FB Conv: {{fbConversions}}
- TikTok Conv: {{tiktokConversions}}

**Din opgave:**
Skriv en ugentlig statusrapport til Sebastian på dansk.
Rapporten skal være struktureret, motiverende men også ærlig omkring risici.

Struktur:
1. Overskrift: En dragende status (f.eks "Cohéro er i stabil vækst 📈").
2. Core Stats Summary: De 3 mest signifikante tal fra ugen.
3. Retention Analyse: Evaluering af churn-risikoen og MRR.
4. AI & Drift: Overblik over omkostninger vs. aktivitet.
5. Strategisk Anbefaling: Hvad skal Sebastian fokusere på i næste uge?

Hold stilen professionel og eksklusiv. Brug Markdown og husk et emnefelt (subject) der skaber nysgerrighed.
Returner et JSON objekt med 'subject' og 'report'.
`,
});

export const adminInsightFlow = ai.defineFlow(
  {
    name: 'adminInsightFlow',
    inputSchema: AdminInsightInputSchema,
    outputSchema: AdminInsightOutputSchema,
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
