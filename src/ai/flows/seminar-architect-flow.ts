'use server';
/**
 * @fileOverview An AI flow to analyze seminar slides and create a structured "Videnskort".
 * 
 * This flow is designed to be highly authoritative, using ONLY the provided slide text.
 * It is optimized to ensure EVERY single slide from the PDF is processed and returned.
 */
import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { 
    SeminarArchitectInputSchema, 
    SeminarAnalysisSchema, 
    SeminarArchitectOutputSchema, 
    type SeminarArchitectInput, 
    type SeminarArchitectOutput 
} from './types';

/**
 * Orchestrates the seminar analysis process using ONLY the provided text.
 * We use a direct generate call with the correct model ID format for Genkit.
 */
export async function seminarArchitect(input: SeminarArchitectInput): Promise<SeminarArchitectOutput> {
    try {
        // Count markers to give the AI a target
        const slideCount = (input.slideText.match(/--- SLIDE \d+ ---/g) || []).length;
        console.log(`[SEMINAR-ARCHITECT] Starting analysis for ${slideCount} slides...`);
        
        if (slideCount === 0) {
            throw new Error("Ingen slides blev fundet i dokumentet. Sørg for at uploade en læsbar PDF.");
        }

        const response = await ai.generate({
            model: 'googleai/gemini-2.5-flash',
            system: `Du er en højt specialiseret akademisk AI-assistent. Din opgave er at udføre en fuldstændig, udtømmende analyse af samtlige undervisningsslides i en præsentation.
            
            **DIN MISSION:**
            Du modtager tekst fra en PDF. 
            Du SKAL generere præcis ét videnskort-objekt for HVER ENESTE af de slides, du finder. 
            Hvis inputtet indeholder ${slideCount} slide-markører, SKAL dit output 'slides' array indeholde præcis ${slideCount} elementer.
            
            **REGLER FOR ANALYSEN:**
            1. **Ingen udeladelser:** Du må IKKE springe slides over, uanset hvor lidt tekst der er på dem.
            2. **Ingen sammenlægninger:** Hvert slide-markør skal have sit eget unikke objekt i 'slides' listen.
            3. **Præcision:** Brug kun den information der findes på det pågældende slide.
            4. **JSON Integritet:** Hvert objekt SKAL indeholde alle felter: 'slideNumber', 'slideTitle', 'summary', 'keyConcepts', 'legalFrameworks', 'practicalTools'.
            
            **DATA-FORMATERING:**
            - 'slideNumber' skal matche tallet fra markøren (f.eks. 1, 2, 3...).
            - Hvis et felt er tomt (f.eks. ingen love), returnér et tomt array [] eller tom streng "".
            - Udelad ALDRIG felter. Indlejr ALDRIG tomme objekter {}.`,
            prompt: `Analyser nu disse ${slideCount} slides systematisk fra start til slut. 
            Sørg for at resultatet er komplet og indeholder alle ${slideCount} kort.
            
            SEMESTER: ${input.semester}
            
            INPUT MATERIALE:
            ---
            ${input.slideText}
            ---`,
            output: {
                schema: SeminarAnalysisSchema
            },
            config: {
                temperature: 0, // Deterministic for maximum accuracy
                maxOutputTokens: 8192 
            }
        });

        if (!response || !response.output) {
            throw new Error("AI returnerede intet svar. Prøv eventuelt med en mindre præsentation.");
        }

        // Final verification and cleanup
        const cleanedSlides = response.output.slides.map(slide => ({
            ...slide,
            keyConcepts: Array.isArray(slide.keyConcepts) ? slide.keyConcepts.filter(c => c && c.term) : [],
            legalFrameworks: Array.isArray(slide.legalFrameworks) ? slide.legalFrameworks.filter(l => l && l.law && l.relevance) : [],
            practicalTools: Array.isArray(slide.practicalTools) ? slide.practicalTools.filter(t => t && t.tool && t.description) : []
        }));

        console.log(`[SEMINAR-ARCHITECT] Analysis complete. Processed ${cleanedSlides.length} slides.`);

        return {
            data: {
                ...response.output,
                slides: cleanedSlides
            },
            usage: {
                inputTokens: response.usage?.inputTokens ?? 0,
                outputTokens: response.usage?.outputTokens ?? 0
            }
        };
    } catch (error: any) {
        console.error("[SEMINAR-ARCHITECT] Analysis failed:", error);
        throw new Error(error.message || "Der skete en fejl under behandlingen af dine slides.");
    }
}
