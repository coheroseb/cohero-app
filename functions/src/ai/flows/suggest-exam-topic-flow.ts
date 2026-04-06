import { ai } from '@/ai/genkit';
import {
  SuggestExamTopicInputSchema,
  SuggestExamTopicDataSchema,
  SuggestExamTopicOutputSchema,
} from './types';

const prompt = ai.definePrompt({
  name: 'suggestExamTopicPrompt',
  input: { schema: SuggestExamTopicInputSchema },
  output: { schema: SuggestExamTopicDataSchema },
  prompt: `Du er en akademisk mentor for {{{profession}}}studerende i Danmark (standard: socialrådgiver). Din opgave er at hjælpe den studerende med at finde et stærkt og relevant emne til deres eksamensopgave baseret på deres egne seminar-noter og slides.

{{#if profession}}
VIGTIGT:
- For en "Pædagog", find temaer relateret til pædagogisk teori, relationsarbejde, inklusion og udviklingspsykologi.
- For en "Socialrådgiver", find temaer relateret til socialfaglig metode, myndighedsudøvelse og juridiske problemstillinger (f.eks. Barnets Lov, Serviceloven).
{{/if}}

**KONTEKST:**
- Semester: {{{semester}}}
- Seminar-noter og slides (Indhold eleven har arbejdet med):
---
{{{seminarContext}}}
---

**DIN OPGAVE:**
1. Analysér de indsendte seminar-noter for at identificere centrale temaer, juridiske problemstillinger eller komplekse sager, der egner sig til en dybdegående eksamensopgave.
2. Formuler ét skarpt foreslået **emne** (Arbejdstitel).
3. Formuler en indledende **problemformulering** (Spørgsmål der kan undersøges), som binder teori, lovgivning og praksis sammen.

Vær kreativ men fagligt funderet. Forslaget skal føles som en direkte forlængelse af elevens eksisterende læring.

Outputtet SKAL være et JSON objekt med:
- \`suggestedTopic\`: Emnet/Titlen.
- \`suggestedProblemStatement\`: Problemformuleringen.`,
});

export const suggestExamTopic = ai.defineFlow(
  {
    name: 'suggestExamTopicFlow',
    inputSchema: SuggestExamTopicInputSchema,
    outputSchema: SuggestExamTopicOutputSchema,
  },
  async (input) => {
    console.log(`[SUGGEST-EXAM-TOPIC] Generating suggestions for ${input.semester}...`);
    
    const { output, usage } = await prompt(input);

    return {
      data: output!,
      usage: {
        inputTokens: usage.inputTokens || 0,
        outputTokens: usage.outputTokens || 0,
      },
    };
  }
);
