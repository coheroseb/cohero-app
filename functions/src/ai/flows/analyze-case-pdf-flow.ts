// @ts-nocheck
import { ai } from '@/ai/genkit';
import {
  AnalyzeCasePdfInputSchema,
  CaseAnalysisSchema,
  AnalyzeCasePdfOutputSchema,
  type AnalyzeCasePdfInput,
  type AnalyzeCasePdfOutput,
} from './types';

export async function analyzeCasePdf(input: AnalyzeCasePdfInput): Promise<AnalyzeCasePdfOutput> {
  return analyzeCasePdfFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeCasePdfPrompt',
  input: { schema: AnalyzeCasePdfInputSchema },
  output: { schema: CaseAnalysisSchema },
  prompt: `Du er en ekspert i socialt arbejde og juridisk sagsbehandling. Din opgave er at analysere en case (ofte fra en PDF) og udtrække nøgleinformationer til en socialrådgiverstuderende.

**Case Tekst:**
---
{{{caseText}}}
---

**Din opgave (på dansk):**
Analyser teksten og udfyld et JSON-objekt med følgende:

1.  **Personer (personer):** En liste over alle personer nævnt. Inkluder deres navn, deres rolle (f.eks. "Barn", "Moder", "Sagsbehandler") og en kort beskrivelse af deres situation eller betydning for sagen.
2.  **Lokationer (lokationer):** En liste over vigtige steder nævnt (f.eks. bopæl, skole, behandlingssted).
3.  **Sociale Problemer (socialeProblemer):** Identificer de sociale problemer eller udfordringer, der beskrives (f.eks. misbrug, omsorgssvigt, økonomiske problemer, psykisk sårbarhed). Brug Peter Bundesens definition på et socialt problem til at identificere disse: "Det er en oplevet, uønsket social livssituation, som der er en udbredt opfattelse om, at politiske institutioner har et ansvar for at afhjælpe. Løsningsindsatsen kan udføres af de politiske institutioner alene eller i samarbejde med andre aktører".
4.  **Tidslinje (tidslinje):** Lav en kronologisk liste over de vigtigste hændelser med dato (hvis muligt) og beskrivelse.
5.  **Relevante Paragraffer (relevanteParagraffer):** Foreslå konkrete lovparagraffer, der er relevante for at løse eller vurdere denne case (f.eks. fra Barnets Lov, Serviceloven eller Forvaltningsloven). Forklar kort hvorfor de er relevante.
6.  **Sammenfatning (sammenfatning):** En kort faglig opsummering af sagen (ca. 3-5 sætninger).
7.  **Røde Lamper (redFlags):** Identificer kritiske advarsler eller risici, der kræver øjeblikkelig opmærksomhed. Dette inkluderer:
    - Sagsbehandlingsfejl (f.eks. overskridelse af frister, manglende partshøring).
    - Sundhedsrisiko (f.eks. akutte helbredsproblemer, misbrug).
    - Vold (f.eks. fysisk eller psykisk vold, overgreb).
    - Andet (f.eks. akut boligmangel, økonomisk desperation).
    Hver "rød lampe" skal have en type, en beskrivelse og en alvorsgrad (low, medium, high).

Vær præcis, faglig og objektiv i din analyse.

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

const analyzeCasePdfFlow = ai.defineFlow(
  {
    name: 'analyzeCasePdfFlow',
    inputSchema: AnalyzeCasePdfInputSchema,
    outputSchema: AnalyzeCasePdfOutputSchema,
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
