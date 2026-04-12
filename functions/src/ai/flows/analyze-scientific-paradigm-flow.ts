import { genkit } from 'genkit';
import { gemini15Flash } from '@genkit-ai/googleai';
import { 
  AnalyzeScientificParadigmInputSchema, 
  AnalyzeScientificParadigmOutputSchema 
} from './types';

const ai = genkit({
  plugins: [],
  model: gemini15Flash,
});

export const analyzeScientificParadigmFlow = ai.defineFlow(
  {
    name: 'analyzeScientificParadigmFlow',
    inputSchema: AnalyzeScientificParadigmInputSchema,
    outputSchema: AnalyzeScientificParadigmOutputSchema,
  },
  async (input) => {
    const { problemStatement } = input;

    const response = await ai.generate({
      model: gemini15Flash,
      prompt: `
        Du er en ekspert i videnskabsteori, specifikt inden for socialt arbejde og samfundsvidenskab.
        Din opgave er at analysere en problemformulering og identificere dens videnskabsteoretiske fundament.

        Analysér følgende problemformulering:
        "${problemStatement}"

        Du skal identificere:
        1. Det ontologiske perspektiv: Hvad antages der om virkeligheden? (f.eks. er virkeligheden objektiv, socialt konstrueret, eller præget af magtstrukturer?)
        2. Det epistemologiske perspektiv: Hvordan opnås viden om dette emne? (f.eks. gennem objektive målinger, fortolkning af mening, eller kritik af ideologi?)
        3. Anbefalede paradigmer: Hvilke retninger passer bedst? (f.eks. Realisme, Fænomenologi, Kritisk Teori, eller Konstruktivisme).
        4. Metodiske råd: Hvordan bør undersøgelsen designes rent praktisk (kvalitativt/kvantitativt, interviewform, analysemetode)?
        5. Kritisk refleksion: Hvilke blinde vinkler er der ved at vælge disse tilgange?

        Vær præcis, akademisk men letforståelig, og brug de danske termer fra videnskabsteorien.
      `,
      output: {
          format: 'json',
          schema: AnalyzeScientificParadigmOutputSchema.shape.data
      }
    });

    const data = response.output;
    if (!data) {
        throw new Error('Kunne ikke generere analyse af videnskabsteori.');
    }

    return {
      data,
      usage: {
        inputTokens: response.usage.inputTokens || 0,
        outputTokens: response.usage.outputTokens || 0,
      },
    };
  }
);
