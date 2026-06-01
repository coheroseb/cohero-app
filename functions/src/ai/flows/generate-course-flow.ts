// @ts-nocheck
import { ai } from '@/ai/genkit';
import {
    CourseDesignSchema,
    type GenerateCourseInput,
    type GenerateCourseOutput,
    type CourseDesign,
} from './types';

/**
 * generateCourseFlow:
 * Designs a pedagogical course based on slides and selected laws.
 */
export async function generateCourse(input: GenerateCourseInput): Promise<GenerateCourseOutput> {
    const { slideText, selectedLaws, semester, profession } = input;

    const systemPrompt = `Du er en pædagogisk ekspert og socialfaglig kursholder. 
Din opgave er at designe et professionelt kursusforløb.

**KONTEKST:**
- Du kan få tilsendt **Slides** (fagligt fundament) og/eller **Love** (juridiske ankre).
- Hvis slides mangler, skal du designe et kursus primært baseret på de valgte love og det faglige felt (profession/semester).
- Hvis love mangler, skal du designe et kursus udelukkende baseret på slides/materiale uden specifikke paragrafforankringer.
- Hvis begge dele er til stede, skal du skabe en stærk rød tråd imellem dem.
- **KILDEKRITIK (VIGTIGT):** Du må KUN designe kurset ud fra det materiale, brugeren har uploadet. Du må ikke opfinde emner eller moduler, som ikke er understøttet af kildematerialet. Dit formål er at transformere brugerens materiale til et pædagogisk format, ikke at skrive et nyt kursus fra bunden.
- **OMSKRIVNING & PLAGIAT (VIGTIGT):** Du må ALDRIG kopiere tekst direkte fra kildematerialet ord-for-ord. Du skal omskrive alt indholdet til en pædagogisk og letforståelig formidling. Brug dit eget professionelle og inspirerende sprog til at forklare pointerne fra materialet, så det føles som unikt kursusindhold og ikke blot en direkte gengivelse af kilden.

**RETNINGSLINJER:**
- Kurset skal være pædagogisk opbygget med klare læringsmål.
- **DYBDE & STRUKTUR (VIGTIGT):** Hver lektion skal være dybdegående og informativ. Det er ikke nok med et kort resumé; brugeren skal kunne lære emnet direkte på siden.
- **UNDEREMNER (VIGTIGT):** Hver lektion SKAL opdeles i 3-5 underemner via 'sections' feltet. Hvert underemne skal have en klar titel og en fyldig, velskrevet tekst (150-300 ord pr. underemne), der forklarer teorien, lovgivningen eller praksis i dybden.
- **INTERAKTIVITET (VIGTIGT):** Hver lektion SKAL indeholde interaktive elementer (interactiveElements) for at gøre kurset digitalt og engagerende. Dette inkluderer:
- **QUIZ (VIGTIGT):** Lav 2-3 quiz-spørgsmål pr. lektion, der tester brugerens dybe forståelse. Svarmulighederne SKAL være meget tæt beslægtet og nuancerede, så det er svært at bruge udelukkelsesmetoden. Undgå indlysende forkerte svar; distraktorerne skal repræsentere realistiske misforståelser eller tæt-beslægtede juridiske begreber, der kræver præcision at skelne imellem.
    - En refleksionsopgave der knytter stoffet til praksis.
    - En case-challenge hvor brugeren skal anvende de juridiske og faglige pointer.
- **LÆSEANBEFALINGER (VIGTIGT):** For hver lektion skal du foreslå 1-2 specifikke steder i relevant litteratur (suggestedReading), hvor brugeren kan dykke dybere. Angiv gerne specifikke sider hvis det er muligt ud fra din viden om de store socialfaglige bøger.
- Sproget skal være professionelt, dansk og inspirerende.
- Kurset skal opdeles i 2-4 moduler, hver med konkrete lektioner.
- Hvert modul skal have en klar beskrivelse.
- Hver lektion skal have en anslået varighed, læringsmål, et uddybende 'contentSummary' og "Legal Links" (hvis love er valgt).

**LITTERATUR:**
- Foreslå 1-3 relevante bøger eller artikler der uddyber emnerne.

Målet er at give brugeren en fuld læringsoplevelse med dybdegående faglighed og interaktion.`;

    const response = await ai.generate({
        model: 'googleai/gemini-3.1-flash-lite',
        system: systemPrompt,
        prompt: `Design et kursus baseret på følgende input:

${selectedLaws && selectedLaws.length > 0 
  ? `VALGTE LOVE:\n${selectedLaws.map(l => `- ${l.name} (${l.abbreviation})`).join('\n')}` 
  : 'INGEN SPECIFIKKE LOVE VALGT. Fokusér på den pædagogiske og faglige formidling.'}

${(slideText && slideText.trim()) || (input.media && input.media.length > 0)
  ? `BRUGERENS MATERIALE (SLIDES/TEKST/FILER):\n${slideText ? `---\n${slideText}\n---` : 'Tekst er vedhæftet som billede/PDF til analyse.'}` 
  : 'INGEN MATERIALER UPLOADET. Brug din faglige viden til at designe et kursus om de valgte love/emner.'}

${input.media && input.media.length > 0 
  ? `VIGTIGT: Der er vedhæftet originale filer (PDF/Billeder). Du SKAL analysere disse visuelt (OCR) for at uddrage det faglige indhold. Dette materiale er din PRIMÆRE kilde.` 
  : ''}

${semester ? `SEMESTER: ${semester}` : ''}
${profession ? `PROFESSION: ${profession}` : ''}

Skab det bedst mulige kursusdesign i det forespurgte JSON-format.
HUSK: Omskriv alt indholdet – ingen direkte citat/plagiat fra materialet.`,
        media: input.media?.map(m => ({ data: m.data, mimeType: m.mimeType })),
        output: {
            schema: CourseDesignSchema,
        },
        config: {
            temperature: 0.7,
        },
    });

    if (!response?.output) {
        throw new Error('AI returnerede intet gyldigt kursusdesign.');
    }

    return {
        data: response.output,
        usage: {
            inputTokens: response.usage?.inputTokens ?? 0,
            outputTokens: response.usage?.outputTokens ?? 0,
        },
    };
}
