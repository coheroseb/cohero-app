// @ts-nocheck
import { ai } from '../genkit';
import { z } from 'genkit';

const UsageSchema = z.object({
  inputTokens: z.number(),
  outputTokens: z.number(),
});

const SimulationCitizenSchema = z.object({
  name: z.string(),
  age: z.number().optional(),
  background: z.string(),
  currentSituation: z.string(),
  userObjective: z.string(),
  hiddenAgendas: z.array(z.string()).optional(),
  emotionalState: z.string(),
  initialTrustLevel: z.number(),
});

// 1. Generate Scenario Flow
export const generateSimulationScenarioFlow = ai.defineFlow(
  {
    name: 'generateSimulationScenarioFlow',
    inputSchema: z.object({
      topic: z.string(),
      profession: z.string().optional(),
      legalContext: z.string().optional(),
    }),
    outputSchema: z.object({
      data: SimulationCitizenSchema,
      usage: UsageSchema,
    }),
  },
  async (input) => {
    const prompt = `Du er en ekspert i at skabe realistiske rollespilsscenarier for ${input.profession || 'socialrådgivere'}. 
    Skab en borger-persona til en svær samtale om emnet: "${input.topic}".
    
    ${input.legalContext ? `VIGTIG JURIDISK RAMME (Brug disse regler til at gøre scenariet juridisk korrekt):\n${input.legalContext}\n` : ''}
    
    Borgeren skal føles som et rigtigt menneske med en kompleks fortid og en nuværende krise.
    Giv dem et navn, en alder, og en detaljeret baggrund. 
    Beskriv deres nuværende situation baseret på den juridiske problemstilling.
    
    VIGTIGT: Definer 'userObjective' - en klar, konkret guide til brugeren om, hvad deres mål med samtalen er (f.eks. "Du skal forsøge at få Mette til at acceptere et frivilligt støtteophold til hendes søn, uden at hun føler sig dømt").
    
    Giv også borgeren 2-3 "skjulte agendaer" (ting de er bange for eller ønsker, som de ikke siger med det samme).
    Sæt deres 'initialTrustLevel' (0-100) baseret på hvor mistroiske de typisk vil være overfor systemet i denne situation.`;

    const { output, usage } = await ai.generate({
      prompt,
      output: { schema: SimulationCitizenSchema }
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

// 2. Run Turn Flow
export const runSimulationTurnFlow = ai.defineFlow(
  {
    name: 'runSimulationTurnFlow',
    inputSchema: z.object({
      citizen: SimulationCitizenSchema,
      chatHistory: z.array(z.object({ role: z.enum(['user', 'assistant']), content: z.string() })),
      userInput: z.string(),
      profession: z.string().optional(),
    }),
    outputSchema: z.object({
      data: z.object({
        citizenResponse: z.string(),
        currentEmotionalState: z.string(),
        trustLevel: z.number(),
        internalThought: z.string(),
        isSimulationEnded: z.boolean(),
      }),
      usage: UsageSchema,
    }),
  },
  async (input) => {
    const { citizen, chatHistory, userInput, profession } = input;
    
    // Construct chat history string
    const historyStr = chatHistory.map(m => `${m.role === 'user' ? 'Socialrådgiver' : citizen.name}: ${m.content}`).join('\n');
    
    const prompt = `Du spiller rollen som borgeren ${citizen.name} i en svær samtale med en ${profession || 'socialrådgiver'}. 
    
    DIN PERSONA:
    Navn: ${citizen.name}
    Baggrund: ${citizen.background}
    Din situation: ${citizen.currentSituation}
    Dine skjulte agendaer: ${citizen.hiddenAgendas?.join(', ')}
    Nuværende tillid: ${citizen.initialTrustLevel}/100
    
    SAMTALE-HISTORIK:
    ${historyStr}
    
    BRUGERENS NYESTE REPLIK:
    "${userInput}"
    
    DIN OPGAVE:
    1. Reagér realistisk på brugerens replik. Hvis de er konfronterende, bliv defensiv. Hvis de er anerkendende, bliv måske lidt mere åben.
    2. Opdatér dit 'trustLevel' (0-100). Små ryk ad gangen.
    3. Beskriv din 'currentEmotionalState' (f.eks. Frustreret, Lettet, Mere lukket).
    4. Skriv din 'internalThought' - hvad tænker du indeni lige nu? (f.eks. "Jeg stoler stadig ikke på ham, men han lyder i det mindste som om han har læst min sag").
    5. Vurder om samtalen naturligt er slut ('isSimulationEnded').
    
    VIGTIGT: Svar på dansk. Hold dine svar korte og naturlige, som i en rigtig samtale. Brug ALDRIG AI-fraser som "Som AI-model...". Du ER ${citizen.name}.`;

    const { output, usage } = await ai.generate({
      prompt,
      output: { schema: z.object({
        citizenResponse: z.string(),
        currentEmotionalState: z.string(),
        trustLevel: z.number(),
        internalThought: z.string(),
        isSimulationEnded: z.boolean(),
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

// 3. Generate Report Flow
export const generateSimulationReportFlow = ai.defineFlow(
  {
    name: 'generateSimulationReportFlow',
    inputSchema: z.object({
      citizen: SimulationCitizenSchema,
      chatHistory: z.array(z.object({ role: z.enum(['user', 'assistant']), content: z.string() })),
      profession: z.string().optional(),
      legalContext: z.string().optional(),
    }),
    outputSchema: z.object({
      data: z.object({
        overallPerformance: z.string(),
        score: z.number(),
        legalFeedback: z.string(),
        communicationFeedback: z.string(),
        citizenExperience: z.string(),
        learningPoints: z.array(z.string()),
      }),
      usage: UsageSchema,
    }),
  },
  async (input) => {
    const { citizen, chatHistory, profession, legalContext } = input;
    const historyStr = chatHistory.map(m => `${m.role === 'user' ? 'Bruger' : 'Borger'}: ${m.content}`).join('\n');

    const prompt = `Du er en censor og supervisor for ${profession || 'socialrådgivere'}. 
    Du skal evaluere en simulation af en svær samtale med borgeren ${citizen.name}.
    
    BORGERENS KONTEKST: ${citizen.background}
    ${legalContext ? `\nRELEVANT LOVGIVNING FRA LOVPORTALEN:\n${legalContext}\n` : ''}
    
    SAMTALE-TRANSKRIPT:
    ${historyStr}
    
    DIN OPGAVE:
    Giv en objektiv og konstruktiv evaluering.
    1. Vurder brugerens 'overallPerformance'.
    2. Giv en 'score' fra 0-100.
    3. Giv specifik 'legalFeedback' (brugte de juraen korrekt/hensigtsmæssigt i forhold til den angivne lovgivning? Var de saglige?).
    4. Giv 'communicationFeedback' (empati, aktiv lytning, de-eskalering, italesættelse af borgerens følelser).
    5. Beskriv 'citizenExperience' - hvordan føltes det for ${citizen.name} at sidde i den anden ende?
    6. Identificer 3 'learningPoints' til fremtiden.
    
    Svar på dansk i en professionel tone.`;

    const { output, usage } = await ai.generate({
      prompt,
      output: { schema: z.object({
        overallPerformance: z.string(),
        score: z.number(),
        legalFeedback: z.string(),
        communicationFeedback: z.string(),
        citizenExperience: z.string(),
        learningPoints: z.array(z.string()),
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
