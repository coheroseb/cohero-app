// @ts-nocheck
import { ai } from '../genkit';
import { z } from 'genkit';

const UsageSchema = z.object({
  inputTokens: z.number(),
  outputTokens: z.number(),
});

const JournalScenarioSchema = z.object({
  id: z.string(),
  title: z.string(),
  category: z.string(),
  difficulty: z.enum(['Let', 'Middel', 'Høj']),
  context: z.string(),
  objective: z.string(),
  legalReference: z.string(),
});

// 1. Generate Journal Scenario Flow
export const generateJournalScenarioFlow = ai.defineFlow(
  {
    name: 'generateJournalScenarioFlow',
    inputSchema: z.object({
      topic: z.string().optional(),
      profession: z.string().optional(),
    }),
    outputSchema: z.object({
      data: JournalScenarioSchema,
      usage: UsageSchema,
    }),
  },
  async (input) => {
    const prompt = `Du er en ekspert i socialfaglig journalisering og juridisk dokumentation.
    Skab et realistisk træningsscenarie for en ${input.profession || 'socialrådgiver'}.
    ${input.topic ? `Emnet er: "${input.topic}"` : 'Vælg et relevant og udfordrende emne fra hverdagen.'}
    
    Scenariet skal indeholde:
    1. En 'context': En kort beskrivelse af hvad der lige er sket (f.eks. en samtale, et hjemmebesøg eller en hændelse).
    2. Et 'objective': Hvad skal brugeren specifikt træne? (f.eks. objektivitet, dokumentation af barnets stemme, eller juridisk argumentation).
    3. En 'legalReference': Hvilken lov eller paragraf er særligt relevant her?
    
    Giv scenariet en fængende titel og en sværhedsgrad.
    Svar på dansk.`;

    const { output, usage } = await ai.generate({
      prompt,
      output: { schema: JournalScenarioSchema }
    });

    return {
      data: output!,
      usage: {
        inputTokens: usage.inputTokens || 0,
        outputTokens: usage.outputTokens || 0,
      },
    };
  }
);

// 2. Evaluate Journal Entry Flow
export const evaluateJournalEntryFlow = ai.defineFlow(
  {
    name: 'evaluateJournalEntryFlow',
    inputSchema: z.object({
      scenario: JournalScenarioSchema,
      journalContent: z.string(),
      profession: z.string().optional(),
    }),
    outputSchema: z.object({
      data: z.object({
        score: z.number(),
        dimensions: z.array(z.object({
          label: z.string(),
          score: z.number(),
          comment: z.string(),
        })),
        summary: z.string(),
        improvedVersion: z.string(),
      }),
      usage: UsageSchema,
    }),
  },
  async (input) => {
    const { scenario, journalContent, profession } = input;

    const prompt = `Du er en erfaren supervisor og censor for ${profession || 'socialrådgivere'}. 
    Du skal evaluere et journalnotat skrevet på baggrund af følgende scenarie:
    
    SCENARIE:
    Titel: ${scenario.title}
    Kontekst: ${scenario.context}
    Mål: ${scenario.objective}
    Relevant Jura: ${scenario.legalReference}
    
    BRUGERENS JOURNALNOTAT:
    """
    ${journalContent}
    """
    
    DIN OPGAVE:
    Evaluér notatet på en skala fra 0-100 baseret på:
    1. Objektivitet (Skiller brugeren fakta fra fortolkning? Er sproget neutralt?)
    2. Juridisk Præcision (Inddrages relevant jura? Er argumentationen holdbar?)
    3. Professionelt Sprog (Er det læsevenligt? Er det præcist?)
    4. Struktur (Er der en logisk sammenhæng?)
    
    Giv en 'summary' med de vigtigste styrker og svagheder.
    Skriv en 'improvedVersion', som viser hvordan notatet kunne have været skrevet optimalt.
    
    Svar på dansk i en konstruktiv og lærerig tone.`;

    const { output, usage } = await ai.generate({
      prompt,
      output: { schema: z.object({
        score: z.number(),
        dimensions: z.array(z.object({
          label: z.string(),
          score: z.number(),
          comment: z.string(),
        })),
        summary: z.string(),
        improvedVersion: z.string(),
      }) }
    });

    return {
      data: output!,
      usage: {
        inputTokens: usage.inputTokens || 0,
        outputTokens: usage.outputTokens || 0,
      },
    };
  }
);
