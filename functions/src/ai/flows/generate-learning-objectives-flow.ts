// @ts-nocheck
import { ai } from '@/ai/genkit';
import {
    GenerateLearningObjectivesDataSchema,
    type GenerateLearningObjectivesInput,
    type GenerateLearningObjectivesOutput,
} from './types';

/**
 * generateLearningObjectivesFlow:
 * Analyzes course content and generates pedagogical learning objectives.
 */
export async function generateLearningObjectives(input: GenerateLearningObjectivesInput): Promise<GenerateLearningObjectivesOutput> {
    const { courseTitle, courseDescription, lessons } = input;

    const systemPrompt = `Du er en pædagogisk ekspert og socialfaglig kursholder. 
Din opgave er at analysere et kursusforløb og uddrage de mest centrale læringsmål (hvad man lærer).

**RETNINGSLINJER:**
- Skab 4-6 præcise, konkrete og professionelle læringsmål.
- Hvert mål skal starte med et handlingsverbum (f.eks. "Forstå", "Anvende", "Navigere i", "Analysere").
- Fokusér på både det teoretiske fundament og den praktiske anvendelse.
- Sproget skal være dansk, professionelt og inspirerende.
- Målene skal afspejle den røde tråd i de tilsendte lektioner.

Målet er at give brugeren et klart overblik over kursets udbytte.`;

    const response = await ai.generate({
        model: 'googleai/gemini-3.5-flash',
        system: systemPrompt,
        prompt: `Analyser dette kursus og generér læringsmål:

KURSUS TITEL: ${courseTitle}
BESKRIVELSE: ${courseDescription}

LEKTIONER:
${lessons.map((l, i) => `${i+1}. ${l.title} (${l.type})${l.summary ? `\n   Info: ${l.summary}` : ''}`).join('\n')}

Generér læringsmålene i det forespurgte JSON-format.`,
        output: {
            schema: GenerateLearningObjectivesDataSchema,
        },
        config: {
            temperature: 0.5,
        },
    });

    if (!response?.output) {
        throw new Error('AI returnerede ingen læringsmål.');
    }

    return {
        data: response.output,
        usage: {
            inputTokens: response.usage?.inputTokens ?? 0,
            outputTokens: response.usage?.outputTokens ?? 0,
        },
    };
}
