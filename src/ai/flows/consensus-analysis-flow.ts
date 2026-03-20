'use server';
/**
 * @fileOverview AI flow to analyze consensus in a collaborative session.
 *
 * - getConsensusAnalysis - Analyzes a set of choices and identifies outliers.
 * - ConsensusAnalysisInput - The input type for the function.
 * - ConsensusAnalysisOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const ChoiceSchema = z.object({
  id: z.string(),
  x: z.number().describe('The x-coordinate of the choice (0-100).'),
  y: z.number().describe('The y-coordinate of the choice (0-100).'),
});

const ConsensusAnalysisInputSchema = z.object({
  caseTitle: z.string().describe('The title or a brief description of the case/dilemma.'),
  choices: z.array(ChoiceSchema).describe("An array of the participants' anonymous choices."),
  axisLabels: z.object({
    x: z.tuple([z.string(), z.string()]).describe("Labels for the x-axis, e.g., ['Individfokus', 'Strukturfokus']."),
    y: z.tuple([z.string(), z.string()]).describe("Labels for the y-axis, e.g., ['Myndighed', 'Civilsamfund']."),
  }).describe("The labels for the coordinate system's axes."),
});

const OutlierSchema = z.object({
  id: z.string().describe("The ID of the outlier choice."),
  justification: z.string().describe("A brief, neutral explanation of why this choice is considered an outlier."),
});

const ConsensusAnalysisSchema = z.object({
  consensusPoint: z.object({
    x: z.number().describe("The calculated average x-coordinate of the consensus."),
    y: z.number().describe("The calculated average y-coordinate of the consensus."),
  }),
  consensusDescription: z.string().describe("A summary of where the class's consensus lies, described in terms of the axis labels."),
  outliers: z.array(OutlierSchema).describe("An array of choices identified as outliers."),
  discussionQuestion: z.string().describe("An open-ended, Socratic question designed to start a discussion about the identified outliers and the general consensus."),
});

const ConsensusAnalysisOutputSchema = z.object({
  data: ConsensusAnalysisSchema,
  usage: z.object({
    inputTokens: z.number(),
    outputTokens: z.number(),
  }),
});
export type ConsensusAnalysisOutput = z.infer<typeof ConsensusAnalysisOutputSchema>;
export type ConsensusAnalysisInput = z.infer<typeof ConsensusAnalysisInputSchema>;


export async function getConsensusAnalysis(input: ConsensusAnalysisInput): Promise<ConsensusAnalysisOutput> {
  return consensusAnalysisFlow(input);
}

const prompt = ai.definePrompt({
  name: 'consensusAnalysisPrompt',
  input: { schema: ConsensusAnalysisInputSchema },
  output: { schema: ConsensusAnalysisSchema },
  prompt: `You are an expert facilitator for social work education in Denmark. Your task is to analyze a set of anonymous choices from studerende on a two-axis model and generate insights for a classroom discussion.

**Case/Dilemma:** "{{caseTitle}}"

**Axis Labels:**
- X-Axis: From '{{{axisLabels.x.[0]}}}' (0) to '{{{axisLabels.x.[1]}}}' (100)
- Y-Axis: From '{{{axisLabels.y.[0]}}}' (0) to '{{{axisLabels.y.[1]}}}' (100)

**Student Choices (as {id, x, y} coordinates):**
{{#each choices}}
- {id: '{{this.id}}', x: {{this.x}}, y: {{this.y}}}
{{/each}}

**Your Tasks:**

1.  **Calculate Consensus Point:** Find the average X and Y coordinates for all choices.
2.  **Describe Consensus:** Write a brief, neutral summary describing where the center of the "faglige sky" (cloud of choices) is located, using the axis labels for context.
3.  **Identify Outliers:** Identify 1-3 choices that are significantly far from the consensus point. For each outlier, provide its ID and a neutral justification for why it's an outlier (e.g., "This choice is the only one prioritizing X while all others prioritize Y.").
4.  **Formulate Discussion Question:** Based on the outliers and the consensus, craft a single, powerful, open-ended Socratic question to initiate a classroom discussion. The question should encourage students to explore the reasoning behind the different perspectives. Example: "Det ser ud til, at der er enighed om X, men et par stykker peger i retning af Y. Hvad kunne de faglige argumenter være for at vælge den Y-orienterede tilgang i denne sag?"

Your entire response must be in Danish and formatted as a single JSON object.
`,
  config: {
    safetySettings: [
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_LOW_AND_ABOVE' },
    ],
  },
});

const consensusAnalysisFlow = ai.defineFlow(
  {
    name: 'consensusAnalysisFlow',
    inputSchema: ConsensusAnalysisInputSchema,
    outputSchema: ConsensusAnalysisOutputSchema,
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
