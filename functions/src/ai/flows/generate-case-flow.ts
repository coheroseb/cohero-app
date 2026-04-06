// @ts-nocheck

/**
 * @fileOverview An AI flow to generate realistic case scenarios for social work students.
 *
 * - generateCase - A function that creates a new case study.
 * - GenerateCaseInput - The input type for the generateCase function.
 * - GenerateCaseOutput - The return type for the generateCase function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { 
    GenerateCaseInputSchema,
    GenerateCaseOutputSchema,
    type CaseData,
    type GenerateCaseInput,
    type GenerateCaseOutput,
} from './types';


export async function generateCase(input: GenerateCaseInput): Promise<GenerateCaseOutput> {
  return generateCaseFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateCasePrompt',
  input: { schema: GenerateCaseInputSchema },
  output: { schema: CaseDataSchema },
  prompt: `{{#if profession}}
You are an expert supervisor for the profession: "{{{profession}}}". 
For a "Pædagog", you MUST create a case centered around a pedagogical institutional setting (e.g., daycare, school, group home, youth club). Focus on developmental pedagogy, relational work, inclusive environments, and the pedagogue's unique role in the borger's life.
For a "Socialrådgiver", you MUST create a case centered around agency work (e.g., Børne- og Familieafdeling, Jobcenter, Socialafdeling). Focus on case management, legal authority, administrative procedures, and the social worker's systemic role.
{{else}}
You are an expert social work supervisor in Denmark, tasked with creating a high-stakes, realistic training case for a social work student.
{{/if}}
The case must be fictional but highly nuanced, grounded in the context of Danish welfare work and the provided legislation.

The topic for this case is: {{{topic}}}.

Your task is to generate a complete case scenario structured as a dilemma game for the studerende.

1.  **Generate Core Case:** Create a complex scenario, protagonists, and an initial observation based on the topic. The scenario MUST be detailed and use multiple HTML <p> tags for readability. It MUST include:
    *   The borger's own perspective and vulnerability.
    *   Subtle "red flags" or conflicting information.
    *   The emotional atmosphere of the situation.
2.  **Create 3 Sequential Dilemmas:** Create an array named \`dilemmas\` containing exactly 3 dilemma objects. Each object must represent a distinct step in handling the case and contain:
    *   A \`dilemma\` string: A clear, concise question that forces a choice between competing professional values.
    *   A \`choices\` array with three distinct, plausible actions (A, B, C).

**STRICT DILEMMA GUIDELINES:**
The dilemmas must represent a logical and increasingly difficult progression:
- **Dilemma 1 (The Hook):** Focus on the initial engagement or immediate safety/legal assessment. There should be a sense of professional doubt.
- **Dilemma 2 (The Pressure):** Focus on a conflict between different stakeholders (e.g., manager, relatives, other authorities) or a discovery that complicates the case.
- **Dilemma 3 (The Conclusion/Plan):** Focus on the long-term professional strategy or a final documentation decision that defines the red thread of the sagsbehandling.

Each choice should represent a different professional priority:
- One choice should prioritize **Strict Legal Procedure/Retssikkerhed**.
- One choice should prioritize **Relationship Building/Inddragelse**.
- One choice should prioritize **Efficiency/Resource allocation or Managerial directions**.

**CRITICAL:** All output must be in Danish.

You MUST ground the case in the legal and ethical context of the following Danish laws and guidelines:
---
{{{lawContext}}}
---
Use your general knowledge of these laws and general ethical principles to create a realistic scenario. Use terminology correctly (e.g. "omsorgspligt", "partshøring", "oplysningspligt", "mindsteindgrebets princip").

Your response must be a JSON object matching the output schema. The 'topic' field in your output should match the input topic: "{{{topic}}}".
Always use the term "borger" instead of "klient" in the scenario and dilemmas.
`,
  config: {
    safetySettings: [
      {
        category: 'HARM_CATEGORY_HATE_SPEECH',
        threshold: 'BLOCK_ONLY_HIGH',
      },
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_NONE',
      },
      {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
      {
        category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        threshold: 'BLOCK_LOW_AND_ABOVE',
      },
    ],
  },
});

const generateCaseFlow = ai.defineFlow(
  {
    name: 'generateCaseFlow',
    inputSchema: GenerateCaseInputSchema,
    outputSchema: GenerateCaseOutputSchema,
  },
  async (input) => {
    const { output, usage } = await prompt(input);
    return {
      caseData: output!,
      usage: {
        inputTokens: usage.inputTokens,
        outputTokens: usage.outputTokens
      }
    };
  }
);
