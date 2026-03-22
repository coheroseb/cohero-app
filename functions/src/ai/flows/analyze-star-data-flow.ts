// @ts-nocheck


/**
 * @fileOverview An AI flow to analyze statistical data from STAR.
 * - analyzeStarData - Pedagogically interprets numbers for social work students.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { 
    AnalyzeStarDataInputSchema, 
    AnalyzeStarDataDataSchema, 
    AnalyzeStarDataOutputSchema, 
    type AnalyzeStarDataInput, 
    type AnalyzeStarDataOutput 
} from './types';

export async function analyzeStarData(input: AnalyzeStarDataInput): Promise<AnalyzeStarDataOutput> {
  return analyzeStarDataFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeStarDataPrompt',
  input: { schema: AnalyzeStarDataInputSchema },
  output: { schema: AnalyzeStarDataDataSchema },
  prompt: `Du er en ekspert i socialrådgivning og dataanalyse i Danmark. Din opgave er at fortolke et datasæt fra Styrelsen for Arbejdsmarked og Rekruttering (STAR) for en socialrådgiverstuderende.

**Kontekst:**
Tabel: "{{{tableTitle}}}"
Variable: {{#each variables}}"{{{this.label}}}" ({{{this.name}}}){{#unless @last}}, {{/unless}}{{/each}}

**Statistisk Resumé:**
{{{statsSummary}}}

**Dataudtræk (Stikprøve):**
{{{dataSample}}}

**Din opgave (på dansk):**
Giv en pædagogisk og praksisnær analyse, der hjælper den studerende med at forstå, hvad disse tal betyder for deres fremtidige profession. Brug udelukkende simple HTML-tags (<h3>, <p>, <ul>, <li>, <strong>) til formatering.

1.  **Overordnet Analyse (analysis):** Beskriv tendenserne og den nuværende tilstand i tallene. Hvilken historie fortæller dataene? Er der markante stigninger eller fald? (f.eks. "Vi ser en tendens til...", "Området X skiller sig ud ved...").
2.  **Akademisk Anvendelse (academicUsage):** Forklar konkret, hvordan disse data kan bruges i en socialfaglig opgave. Giv eksempler på, hvordan de kan underbygge en problemformulering eller bruges i et analyseafsnit (f.eks. "Du kan bruge dette til at belyse ulighed i...", "Dette tal underbygger din tese om..."). Brug HTML-tags som <h3> for overskrifter og <p> for tekst.
3.  **Refleksionsspørgsmål (socraticQuestions):** Generer 2-3 dybe, åbne spørgsmål, der opfordrer den studerende til at tænke over de menneskelige eller sociale konsekvenser bag statistikken.

Dit svar SKAL være et JSON-objekt, der matcher output-skemaet.`,
  config: {
    safetySettings: [
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_LOW_AND_ABOVE' },
    ],
  },
});

const analyzeStarDataFlow = ai.defineFlow(
  {
    name: 'analyzeStarDataFlow',
    inputSchema: AnalyzeStarDataInputSchema,
    outputSchema: AnalyzeStarDataOutputSchema,
  },
  async (input) => {
    const { output, usage } = await prompt(input);
    return {
      data: output!,
      usage: {
        inputTokens: usage.inputTokens,
        outputTokens: usage.outputTokens,
      },
    };
  }
);
