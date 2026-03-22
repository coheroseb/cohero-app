
/**
 * @fileOverview An AI flow to analyze an oral exam presentation.
 *
 * - oralExamAnalysis - Analyzes the text of a presentation.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import {
  OralExamAnalysisInputSchema,
  OralExamAnalysisDataSchema,
  OralExamAnalysisOutputSchema,
  type OralExamAnalysisInput,
  type OralExamAnalysisOutput,
} from './types';

export async function oralExamAnalysis(input: OralExamAnalysisInput): Promise<OralExamAnalysisOutput> {
  return oralExamAnalysisFlow(input);
}

const prompt = ai.definePrompt({
  name: 'oralExamAnalysisPrompt',
  input: { schema: OralExamAnalysisInputSchema },
  output: { schema: OralExamAnalysisDataSchema },
  prompt: `You are an expert examiner in social work in Denmark. Your task is to provide a "X-ray analysis" of a student's oral exam presentation. The analysis should be structured, pedagogical, and focus on professional development.

**Exam Type:** {{{examType}}}
**Presentation Text:**
---
{{{presentationText}}}
---

**Ethical Guidelines for Context:**
---
{{{ethicsContext}}}
---

**Relevant Law Context:**
---
{{{lawContext}}}
---

**Your Task:**
Analyze the presentation text and provide feedback in four distinct categories. Your response MUST be a JSON object adhering to the specified schema. All output must be in Danish.

1.  **Terminology-Thermometer (\`terminologyAnalysis\`):**
    *   Scan the text for both professional social work terms and everyday language used to describe professional concepts.
    *   For 2-3 key instances, provide an object with:
        *   \`term\`: The word or phrase used by the student (e.g., "borgeren blev sur").
        *   \`feedback\`: A comment on the term's usage (e.g., "Her bruges hverdagssprog...").
        *   \`suggestion\`: A concrete alternative using precise professional language (e.g., "Overvej at bruge 'reaktans' eller 'affektudbrud' for at styrke din faglige profil.").

2.  **The Logical Bridge (\`logicalBridgeAnalysis\`):**
    *   Analyze the structure and flow of the presentation. Identify 2-3 key transition points between major themes (e.g., from case presentation to theory, from theory to legal framework, from analysis to conclusion).
    *   For each transition, provide an object with:
        *   \`point\`: A summary of the point being transitioned from (e.g., "Efter præsentation af Bourdieus kapitalbegreb...").
        *   \`connectionToNext\`: An analysis of how well it connects to the next point (e.g., "...viser du en klar kobling til, hvordan lovgivningen om økonomisk støtte forstærker ulighed.").
        *   \`status\`: "strong" if the connection is clear and explicit, "weak" if it is missing or implicit.

3.  **Tempo & Intensity (Simulated) (\`tempoAnalysis\`):**
    *   Since you cannot hear the audio, simulate this by identifying 2-3 sections in the text that are particularly dense with information (e.g., complex legal references, dense theory).
    *   For each section, provide an object with:
        *   \`observation\`: Describe the dense section (e.g., "Omkring din gennemgang af Forvaltningslovens §19-24...").
        *   \`suggestion\`: Give advice as if you were listening (e.g., "Husk at holde en kort pause her for at give censor tid til at notere. Det er et komplekst, men vigtigt punkt.").

4.  **The Socratic Resistance (\`socraticQuestions\`):**
    *   Based on the entire presentation, generate an array of exactly 3 challenging, open-ended questions that a real examiner would likely ask to test the student's deeper understanding and identify the limits of their analysis. The questions should probe potential weaknesses, unexamined assumptions, or alternative perspectives.
`,
});

const oralExamAnalysisFlow = ai.defineFlow(
  {
    name: 'oralExamAnalysisFlow',
    inputSchema: OralExamAnalysisInputSchema,
    outputSchema: OralExamAnalysisOutputSchema,
  },
  async (input) => {
    const { output, usage } = await prompt(input);
    return {
      data: output!,
      usage: {
        inputTokens: usage.inputTokens,
        outputTokens: usage.outputTokens,
      },
    };
  }
);
