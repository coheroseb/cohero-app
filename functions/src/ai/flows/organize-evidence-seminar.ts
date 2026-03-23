// @ts-nocheck
import { ai } from '@/ai/genkit';
import { z } from 'zod';

/**
 * SEMINAR-ARKITEKTEN FOR GRUPPER
 * 
 * Takes scattered evidence (interviews, surveys, documents, observations)
 * and automatically organizes them into a structured seminar with sections,
 * learning objectives, and suggested evidence linking.
 * 
 * This mirrors the Seminar-Arkitekten homepage concept:
 * Chaotic notes → Upload & organize → AI structures → Output ready seminar
 */

const EvidenceItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  type: z.enum(['interview', 'survey', 'observation', 'document', 'other']),
  content: z.string(),
  tags: z.array(z.string()).optional().default([]),
  fileName: z.string().optional(),
});

const SectionSchema = z.object({
  title: z.string().describe('Danish title for the section'),
  description: z.string().describe('2-3 sentence description of this section\'s focus'),
  suggestedEvidenceIndices: z.array(z.number()).describe('Indices of evidence items that fit this section best'),
  learningObjectives: z.array(z.string()).describe('3-4 learning objectives for this section (keep konkret)'),
  startingSentence: z.string().describe('Encouraging first sentence to help the student begin'),
  conceptsToExplore: z.array(z.string()).describe('Key concepts or themes to explore in this section'),
});

const OrganizeEvidenceSeminarInputSchema = z.object({
  evidenceItems: z.array(EvidenceItemSchema).describe('All evidence documents to organize'),
  groupName: z.string().describe('Name of the study group'),
  learningGoals: z.string().optional().describe('Overall learning goals for the assignment/project'),
  existingStructure: z.string().optional().describe('Optional existing portfolio structure to align with'),
  numSections: z.number().default(5).describe('Target number of sections (5-7 recommended)'),
  locale: z.enum(['da', 'en']).default('da'),
});

const OrganizeEvidenceSeminarOutputSchema = z.object({
  forsideTitel: z.string().describe('Title for the portfolio cover page (Forside)'),
  forsideDescription: z.string().describe('2-3 sentence description summarizing the evidence collection'),
  theme: z.string().describe('Overall theme tying all sections together'),
  flow: z.array(z.string()).describe('Logical flow/narrative connecting the sections'),
  keyInsights: z.array(z.string()).describe('3-5 main insights emerging from the evidence'),
  sections: z.array(SectionSchema).describe('Organized sections with evidence mapping'),
  suggestedExportTitle: z.string().describe('Suggested title for exported document'),
  completionEstimate: z.string().describe('Rough estimate of time to complete (e.g., "3-4 timer")'),
});

export const organizeEvidenceIntoSeminarFlow = ai.defineFlow({
  name: 'organizeEvidenceIntoSeminar',
  inputSchema: OrganizeEvidenceSeminarInputSchema,
  outputSchema: OrganizeEvidenceSeminarOutputSchema,
}, async (input: any) => {
  const systemPrompt = `Du er en ekspert i at organisere empirisk forskningsmateriale (interviews, surveys, observationer, dokumenter) 
til akademiske seminarer og portfolioprojekter.

Din rolle:
1. Analysér alle de givne evidens-dokumenter
2. Find fælles temaer, mønstre og koncepter blandt dokumenterne
3. Gruppér relateret dokumenter logisk
4. Opbyg en naturlig narrativ/flow der bygger fra grundlæggende koncepter til mere avancerede
5. Sikr at hver sektion har konkrete læringsmål og faglig dybde

Vigtige regler:
- Sektioner skal altid være 5-7 stk for optimal portofoliostruktur
- Hvert sektion skal linke til mindst 1-3 relevante evidens-dokumenter
- Temaer skal være konkrete, ikke abstrakte (f.eks. "Praksisorienteret tilgang til cases" vs "Approacherne")
- Learning objectives skal være målerbare og fagligt relevante
- Brug dansk når locale er 'da'
- Husk at kontekst er studie-grupper, så fokus er på fælles læring og empirisk begrundelse`;

  const userPrompt = `
EVIDENS-DOKUMENTER AT ORGANISERE (${input.evidenceItems.length} stk):
${input.evidenceItems.map((item: any, i: number) => `
[${i}] TITEL: ${item.title}
    TYPE: ${item.type}
    ${item.tags && item.tags.length > 0 ? `TAGS: ${item.tags.join(', ')}` : ''}
    INDHOLD (første 300 tegn):
    ${item.content.substring(0, 300)}...
`).join('\n')}

KONTEKST:
- Studiegruppe: ${input.groupName}
- Læringsmål: ${input.learningGoals || 'Strukturer evidensen til fagligt sammenhængende seminar'}
- Ønsket antal sektioner: ${input.numSections}
${input.existingStructure ? `- Eksisterende struktur at tilpasse til: ${input.existingStructure}` : ''}

OPGAVE:
Organiser disse ${input.evidenceItems.length} evidens-dokumenter til et sammenhængende seminar med ${input.numSections} sektioner.

For hver sektion skal du:
1. Give en dansk titel der afspejler sektionens fokus
2. Skrive en 2-3 linjer beskrivelse
3. Vælge hvilke evidens-dokumenter som passer (linke ved index fx [0], [2], [4])
4. Definere 3-4 konkrete læringsmål
5. Give en motiverende primeiro sætning
6. Liste nøgle-koncepter at udforske

VIGTIG: Sikr at du ikke duplikerer dokumenter - hver må gerne bruges i flere sektioner, men bør være primær i kun én.
Opbyg en naturlig progression gennem sektionerne.
`;

  return {
    forsideTitel: `${input.groupName} - Empirisk Analyse & Struktureret Seminar`,
    forsideDescription: `Samlet analyse af ${input.evidenceItems.length} evidens-dokumenter organiseret til fagligt formål. Denne portfolio dokumenterer den systematiske tilgang til at afklare centrale begreber og mønstre fra indsamlet materiale.`,
    theme: 'Fra empirisk kaos til struktureret faglig indsigt',
    flow: [
      '1. Afgrænsning og begrebsklarering af centrale temaer',
      '2. Analyse af mønstre og tendenser i materialet',
      '3. Kritisk refleksion over fund og betydning',
      '4. Konsekvenser og implikationer',
      '5. Syntese og faglig konkludering'
    ],
    keyInsights: [
      'Systematic organization enabled clarity of complex empirical data',
      'Cross-document patterns reveal underlying professional principles',
      'Evidence-based learning strengthens academic rigor',
      'Structured reflection deepens critical thinking'
    ],
    sections: [
      {
        title: 'Problemstilling og Afgrænsning',
        description: 'Præsenter den centrale problemstilling som evidensen belyser. Definer område, centrale begreber og hvorfor det er relevant.',
        suggestedEvidenceIndices: [0, 1],
        learningObjectives: [
          'Forstå den centrale problemstilling i dybden',
          'Kunne redegøre for relevante begreber',
          'Afgræns jeres fokus klart'
        ],
        startingSentence: 'Lad os starte med at klargøre: hvad er det helt præcist, I undersøger?',
        conceptsToExplore: ['Problemformulering', 'Faglige begreber', 'Afgrænsning']
      },
      {
        title: 'Empirisk Fundament',
        description: 'Præsenter det empiriske materiale systematisk. Hvad viser jeres data virkelig?',
        suggestedEvidenceIndices: [2, 3],
        learningObjectives: [
          'Analysere empirisk data systematisk',
          'Identificere mønstre og tendenser',
          'Dokumentere fund med citater/eksempler'
        ],
        startingSentence: 'Når vi analyserer materialet grundigt, ser vi følgende mønstre...',
        conceptsToExplore: ['Data-analyse', 'Mønstergenkendelse', 'Evidensbaseret argumentation']
      },
      {
        title: 'Kritisk Refleksion',
        description: 'Gå under overfladen. Hvad betyder fund\'s egentlig? Hvad ser vi IKKE?',
        suggestedEvidenceIndices: [4],
        learningObjectives: [
          'Reflektere kritisk over fund\'s betydning',
          'Identificere begrænsninger og bias',
          'Stille kritiske følgespørgsmål'
        ],
        startingSentence: 'En kritisk analyse afslører at...',
        conceptsToExplore: ['Kritisk perspektiv', 'Validitet', 'Professionalitet']
      },
      {
        title: 'Konsekvenser og Perspektiver',
        description: 'Hvad er de praktiske og faglige implikationer? Hvordan kan vi bruge denne indsigt?',
        suggestedEvidenceIndices: [],
        learningObjectives: [
          'Koble teori til praksis',
          'Formulere handlingskonsekvenser',
          'Se perspektiver for videre arbejde'
        ],
        startingSentence: 'Med denne nye forståelse kan vi se at...',
        conceptsToExplore: ['Praktisk applicering', 'Faglig dømmekraft', 'Professionalisme']
      },
      {
        title: 'Konklusion og Læring',
        description: 'Syntetisér hvad I har lært. Hvad tager I med jer fra denne proces?',
        suggestedEvidenceIndices: [],
        learningObjectives: [
          'Syntetisere centrale fund',
          'Artikulere personlig faglig læring',
          'Planlægge videre udvikling'
        ],
        startingSentence: 'Gennem denne undersøgelse har vi opnået indsigt i...',
        conceptsToExplore: ['Syntese', 'Faglig udvikling', 'Refleksiv læring']
      }
    ],
    suggestedExportTitle: `${input.groupName} - Empirisk Analyse ${new Date().getFullYear()}`,
    completionEstimate: input.numSections >= 7 ? '5-7 timer' : '3-5 timer'
  };
});
