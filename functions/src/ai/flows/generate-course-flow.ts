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
- Hvis love mangler, skal du designe et kursus udelukkende baseret på slides uden specifikke paragrafforankringer.
- Hvis begge dele er til stede, skal du skabe en stærk rød tråd imellem dem.

**RETNINGSLINJER:**
- Kurset skal være pædagogisk opbygget med klare læringsmål.
- **INTERAKTIVITET (VIGTIGT):** Hver lektion SKAL indeholde interaktive elementer (`interactiveElements`) for at gøre kurset digitalt og engagerende. Dette inkluderer:
    - 2-3 quiz-spørgsmål til tjek af forståelse.
    - En refleksionsopgave der knytter stoffet til praksis.
    - En case-challenge hvor brugeren skal anvende de juridiske og faglige pointer.
- Sproget skal være professionelt, dansk og inspirerende.
- Kurset skal opdeles i 2-4 moduler, hver med konkrete lektioner.
- Hvert modul skal have en klar beskrivelse.
- Hver lektion skal have en anslået varighed, læringsmål, et resumé og "Legal Links" (hvis love er valgt).

**LITTERATUR:**
- Foreslå 1-3 relevante bøger eller artikler der uddyber emnerne.

Målet er at give brugeren et færdigt "Course Layout" som de kan bruge til at undervise eller studere efter.`;

    const response = await ai.generate({
        model: 'googleai/gemini-2.5-flash',
        system: systemPrompt,
        prompt: `Design et kursus baseret på følgende input:

${selectedLaws && selectedLaws.length > 0 
  ? `VALGTE LOVE:\n${selectedLaws.map(l => `- ${l.name} (${l.abbreviation})`).join('\n')}` 
  : 'INGEN SPECIFIKKE LOVE VALGT. Fokusér på den pædagogiske og faglige formidling.'}

${slideText && slideText.trim() 
  ? `BRUGERENS MATERIALE (SLIDES/TEKST):\n---\n${slideText}\n---` 
  : 'INGEN SLIDES UPLOADET. Brug din faglige viden til at designe et kursus om de valgte love/emner.'}

${semester ? `SEMESTER: ${semester}` : ''}
${profession ? `PROFESSION: ${profession}` : ''}

Skab det bedst mulige kursusdesign i det forespurgte JSON-format.`,
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
