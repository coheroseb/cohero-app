
/**
 * @fileOverview Seminar-Arkitekten AI Flow
 *
 * Strategy:
 *  - If <= 30 slides: single pass, 65k output tokens
 *  - If > 30 slides: chunked processing (batches of 20), then merged
 *
 * This guarantees EVERY slide is processed regardless of presentation size.
 */
import { ai } from '@/ai/genkit';
import {
    SeminarAnalysisSchema,
    type SeminarArchitectInput,
    type SeminarArchitectOutput,
    type SeminarAnalysis,
} from './types';

const CHUNK_SIZE = 20; // slides per batch
const MAX_OUTPUT_TOKENS = 65536; // Gemini 2.5 Flash max

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Split raw slideText into individual slide blocks */
function splitIntoSlides(slideText: string): { number: number; text: string }[] {
    const parts = slideText.split(/(?=--- SLIDE \d+ ---)/);
    return parts
        .map(block => {
            const match = block.match(/--- SLIDE (\d+) ---/);
            if (!match) return null;
            return { number: parseInt(match[1], 10), text: block.trim() };
        })
        .filter(Boolean) as { number: number; text: string }[];
}

/** Build the system prompt */
function buildSystem(count: number): string {
    return `Du er en topspecialiseret dansk akademisk AI-assistent, der analyserer socialfaglige undervisningsslides.

**ABSOLUT PÅKRÆVET:**
- Du SKAL returnere præcis ét json-objekt pr. slide-markør.
- Det samlede 'slides' array SKAL indeholde præcis ${count} elementer — ikke ét mere, ikke ét mindre.
- Du må IKKE sammenlægge, udelade eller springe slides over.

**FOR HVERT SLIDE skal du producere:**
- slideNumber: Tallet fra markøren (heltal)
- slideTitle: Kortfattet, præcis overskrift baseret på slideindhold (maks. 12 ord)
- summary: 2-4 sætninger der opsummerer slidets faglige kernepunkt
- keyConcepts: Liste af faglige begreber med term + en-linje-definition (tomt array [] hvis ingen)
- legalFrameworks: Relevante love/bekendtgørelser med law, paragraphs[], relevance (tomt array [] hvis ingen)
- practicalTools: Faglige metoder/redskaber med tool + description (tomt array [] hvis ingen)

**REGLER:**
- Brug KUN hvad der nøjagtigt fremgår af det pågældende slide.
- Tomme slides → skriv slideTitle: "Slide uden tekst", summary: "Slides indeholder ingen tekst.", og tomme arrays.
- INGEN udeladelse af JSON-felter — alle 6 felter SKAL være til stede for hvert element.
- Hold dig til dansk output.`;
}

/** Analyze a batch of slides */
async function analyzeBatch(
    slides: { number: number; text: string }[],
    semester: string
): Promise<any[]> {
    const batchText = slides.map(s => s.text).join('\n\n');
    const count = slides.length;

    const response = await ai.generate({
        model: 'googleai/gemini-2.5-flash',
        system: buildSystem(count),
        prompt: `Analyser nu disse ${count} slides systematisk og returnér præcis ${count} elementer i 'slides' arrayet.

SEMESTER: ${semester}

SLIDES:
---
${batchText}
---

Husk: Output SKAL indeholde præcis ${count} slides-objekter med slideNumber ${slides[0].number} til ${slides[slides.length - 1].number}.`,
        output: {
            schema: SeminarAnalysisSchema,
        },
        config: {
            temperature: 0,
            maxOutputTokens: MAX_OUTPUT_TOKENS,
        },
    });

    if (!response?.output?.slides) {
        throw new Error(`Batch ${slides[0].number}-${slides[slides.length - 1].number}: Ingen output fra AI.`);
    }

    return response.output.slides;
}

// ---------------------------------------------------------------------------
// Main Export
// ---------------------------------------------------------------------------

export async function seminarArchitect(input: SeminarArchitectInput): Promise<SeminarArchitectOutput> {
    const allSlides = splitIntoSlides(input.slideText);
    const slideCount = allSlides.length;

    console.log(`[SEMINAR-ARCHITECT] Starting analysis for ${slideCount} slides`);

    if (slideCount === 0) {
        throw new Error('Ingen slides blev fundet i dokumentet. Kontroller at filen er læsbar og indeholder tekst.');
    }

    let allProcessedSlides: any[] = [];
    let totalInputTokens = 0;
    let totalOutputTokens = 0;

    if (slideCount <= CHUNK_SIZE * 2) {
        // ── SINGLE PASS for smaller decks ──────────────────────────────────────
        console.log(`[SEMINAR-ARCHITECT] Single-pass mode (${slideCount} slides)`);
        
        const response = await ai.generate({
            model: 'googleai/gemini-2.5-flash',
            system: buildSystem(slideCount),
            prompt: `Analyser nu ALLE ${slideCount} slides og returnér PRÆCIS ${slideCount} elementer i 'slides' arrayet.

SEMESTER: ${input.semester}

SLIDES:
---
${input.slideText}
---`,
            output: { schema: SeminarAnalysisSchema },
            config: { temperature: 0, maxOutputTokens: MAX_OUTPUT_TOKENS },
        });

        if (!response?.output?.slides) {
            throw new Error('AI returnerede intet gyldigt svar.');
        }

        allProcessedSlides = response.output.slides;
        totalInputTokens = response.usage?.inputTokens ?? 0;
        totalOutputTokens = response.usage?.outputTokens ?? 0;

        // If AI missed slides, fill in gaps
        if (allProcessedSlides.length < slideCount) {
            console.warn(`[SEMINAR-ARCHITECT] AI returned ${allProcessedSlides.length}/${slideCount} – filling gaps`);
            const processedNums = new Set(allProcessedSlides.map((s: any) => s.slideNumber));
            for (const slide of allSlides) {
                if (!processedNums.has(slide.number)) {
                    const truncated = slide.text.replace(/--- SLIDE \d+ ---\n?/, '').trim();
                    allProcessedSlides.push({
                        slideNumber: slide.number,
                        slideTitle: `Slide ${slide.number}`,
                        summary: truncated ? `Indhold: ${truncated.slice(0, 200)}` : 'Slide uden tekst.',
                        keyConcepts: [],
                        legalFrameworks: [],
                        practicalTools: [],
                    });
                }
            }
        }
    } else {
        // ── CHUNKED MODE for large decks ───────────────────────────────────────
        const chunks: { number: number; text: string }[][] = [];
        for (let i = 0; i < allSlides.length; i += CHUNK_SIZE) {
            chunks.push(allSlides.slice(i, i + CHUNK_SIZE));
        }

        console.log(`[SEMINAR-ARCHITECT] Chunked mode: ${chunks.length} batches of up to ${CHUNK_SIZE} slides`);

        for (let ci = 0; ci < chunks.length; ci++) {
            const chunk = chunks[ci];
            console.log(`[SEMINAR-ARCHITECT] Processing batch ${ci + 1}/${chunks.length} (slides ${chunk[0].number}-${chunk[chunk.length - 1].number})`);
            const batchResult = await analyzeBatch(chunk, input.semester);
            allProcessedSlides.push(...batchResult);
        }
    }

    // ── FINAL CLEANUP & SORT ───────────────────────────────────────────────────
    const cleanedSlides = allProcessedSlides
        .map((slide: any) => ({
            slideNumber: slide.slideNumber,
            slideTitle: slide.slideTitle || `Slide ${slide.slideNumber}`,
            summary: slide.summary || '',
            keyConcepts: (Array.isArray(slide.keyConcepts) ? slide.keyConcepts : []).filter((c: any) => c?.term),
            legalFrameworks: (Array.isArray(slide.legalFrameworks) ? slide.legalFrameworks : []).filter((l: any) => l?.law && l?.relevance),
            practicalTools: (Array.isArray(slide.practicalTools) ? slide.practicalTools : []).filter((t: any) => t?.tool && t?.description),
        }))
        .sort((a: any, b: any) => a.slideNumber - b.slideNumber);

    // Deduplicate by slideNumber (keep last occurrence as it's usually more complete)
    const dedupedSlides = cleanedSlides.reduce((acc: any[], slide: any) => {
        const existing = acc.findIndex((s: any) => s.slideNumber === slide.slideNumber);
        if (existing >= 0) acc[existing] = slide;
        else acc.push(slide);
        return acc;
    }, []);

    console.log(`[SEMINAR-ARCHITECT] Done. Output: ${dedupedSlides.length}/${slideCount} slides.`);

    // Generate an overall title from the content
    const overallTitle = dedupedSlides[0]?.slideTitle || 'Seminar Videnskort';

    return {
        data: {
            overallTitle,
            slides: dedupedSlides,
        } as SeminarAnalysis,
        usage: {
            inputTokens: totalInputTokens,
            outputTokens: totalOutputTokens,
        },
    };
}
