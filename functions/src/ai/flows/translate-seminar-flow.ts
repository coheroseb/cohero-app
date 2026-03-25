// @ts-nocheck
import { ai } from '@/ai/genkit';
import { 
    SeminarAnalysisSchema, 
    TranslateSeminarInputSchema, 
    type TranslateSeminarInput, 
    type TranslateSeminarOutput 
} from './types';

export async function translateSeminar(input: TranslateSeminarInput): Promise<TranslateSeminarOutput> {
    const { analysis, targetLanguage } = input;
    const langLabel = targetLanguage === 'da' ? 'Dansk' : 'Engelsk';

    console.log(`[TRANSLATE-SEMINAR] Translating seminar to ${langLabel}`);

    const response = await ai.generate({
        model: 'googleai/gemini-2.5-flash',
        system: `Du er en ekspert i akademisk oversættelse (Socialrådgiver-faglighed). 
Oversæt det modtagne seminar-videnskort til ${langLabel}.
BEVAR den præcise JSON-struktur og bevar slide-numrene. 
Alle tekster, herunder titler, opsummeringer, begreber (både term og definition), jura-relevans og metode-beskrivelser skal oversættes.
VIGTIGT: Socialfaglige begreber skal oversættes præcist til den gængse terminologi på ${langLabel}.`,
        prompt: `Her er seminar-videnskortet der skal oversættes til ${langLabel}:
---
${JSON.stringify(analysis, null, 2)}
---`,
        output: {
            schema: SeminarAnalysisSchema
        },
        config: {
            temperature: 0,
        }
    });

    if (!response?.output) {
        throw new Error('Kunne ikke oversætte seminaret.');
    }

    return {
        data: response.output,
        usage: {
            inputTokens: response.usage?.inputTokens ?? 0,
            outputTokens: response.usage?.outputTokens ?? 0,
        }
    };
}
