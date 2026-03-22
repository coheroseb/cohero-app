
/**
 * @fileOverview An AI-powered tool to assess if there is a basis for a grade complaint.
 *
 * - getSecondOpinion - A function that analyzes a student work against grading criteria.
 * - SecondOpinionInput - The input type for the getSecondOpinion function.
 * - SecondOpinionOutput - The return type for the getSecondOpinion function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const SecondOpinionInputSchema = z.object({
  studyRegulations: z.string().describe("The relevant sections of the study regulations or course description, including learning objectives."),
  examRegulations: z.string().describe("The relevant sections of the exam regulations."),
  assignmentText: z.string().describe("The full text of the social work student's submitted assignment."),
  grade: z.string().describe('The grade the social work student received (e.g., "7", "10", "B").'),
  feedback: z.string().optional().describe("Optional feedback from the examiner."),
});
export type SecondOpinionInput = z.infer<typeof SecondOpinionInputSchema>;

const AnalysisSchema = z.object({
  isComplaintJustified: z.boolean().describe('A boolean indicating whether there is a plausible basis for a complaint.'),
  isGradeAccurate: z.boolean().describe('A boolean indicating if the given grade is considered accurate/fair based on the analysis.'),
  gradeAccuracyArgument: z.string().describe("A detailed, concrete argument explaining why the grade is or isn't accurate. Must reference specific parts of the assignment and learning goals. Use HTML for formatting."),
  riskAssessment: z.array(z.string()).describe("An assessment of the risk of receiving a lower grade upon re-evaluation, presented as bullet points. Explain why the risk is low, medium, or high. Must be in Danish."),
  strengths: z.array(z.string()).describe("A list of bullet points summarizing the assignment's strengths and what the social work student did well, referencing the learning objectives. Must be in Danish."),
  weaknesses: z.array(z.string()).describe("A list of bullet points summarizing the assignment's weaknesses and areas for improvement, referencing the learning objectives. Must be in Danish."),
  suggestedNextSteps: z.array(z.string()).describe('A list of concrete, actionable next steps for the social work student, written from a neutral, advisory perspective, presented as an array of strings (bullet points). Must be in Danish.'),
});
export type Analysis = z.infer<typeof AnalysisSchema>;

const SecondOpinionOutputSchema = z.object({
  data: AnalysisSchema,
  usage: z.object({
    inputTokens: z.number(),
    outputTokens: z.number(),
  }),
  input: SecondOpinionInputSchema,
});
export type SecondOpinionOutput = z.infer<typeof SecondOpinionOutputSchema>;

export async function getSecondOpinion(input: SecondOpinionInput): Promise<SecondOpinionOutput> {
  return secondOpinionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'secondOpinionPrompt',
  input: { schema: SecondOpinionInputSchema },
  output: { schema: AnalysisSchema },
  prompt: `You are an impartial and expert external examiner (censor) and university lecturer in the Danish higher education system. Your task is to provide a highly concrete, document-based analysis of a student's graded assignment.

**YOUR OBJECTIVE:**
Determine if the received grade accurately reflects the quality of the assignment based on the provided documents. You must take a definitive stand and argue for or against the grade's accuracy.

**INSTRUCTIONS FOR ANALYSIS:**
1.  **Context Identification:** Scan the 'examRegulations' and 'assignmentText' to identify the specific context (e.g., semester, module, or specific exam type). 
2.  **Learning Goal Extraction:** Locate and extract ONLY the learning objectives (læringsmål) and criteria from the 'studyRegulations' that are directly relevant to this specific exam/context. Discard any irrelevant information from the regulations.
3.  **Document-Based Assessment:** Analyze the 'assignmentText' point-by-point against the relevant learning goals identified in step 2.
4.  **Grading Scale Alignment:** Use the official Danish 7-step scale descriptions below to determine which grade best matches the work's level of goal fulfillment.

**7-TRINS-SKALAEN (Grading Scale):**
- **12 (Den fremragende præstation):** Karakteren 12 gives for den fremragende præstation, der demonstrerer udtømmende opfyldelse af fagets mål, med ingen eller få uvæsentlige mangler.
- **10 (Den fortrinlige præstation):** Karakteren 10 gives for den fortrinlige præstation, der demonstrerer omfattende opfyldelse af fagets mål, med nogle mindre væsentlige mangler.
- **7 (Den gode præstation):** Karakteren 7 gives for den gode præstation, der demonstrerer opfyldelse af fagets mål, med en del mangler.
- **4 (Den jævne præstation):** Karakteren 4 gives for den jævne præstation, der demonstrerer en mindre grad af opfyldelse af fagets mål, med adskillige væsentlige mangler.
- **02 (Den tilstrækkelige præstation):** Karakteren 02 gives for den tilstrækkelige præstation, der demonstrerer den minimalt acceptable grad af opfyldelse af fagets mål.
- **00 (Den utilstrækkelige præstation):** Karakteren 00 gives for den utilstrækkelige præstation, der ikke demonstrerer en acceptabel grad af opfyldelse af fagets mål.
- **-3 (Den ringe præstation):** Karakteren -3 gives for den helt uacceptable præstation.

**OUTPUT REQUIREMENTS:**
- All output must be in Danish. 
- Use simple HTML tags (<p>, <strong>, <ul>, <li>) in the 'gradeAccuracyArgument'.
- The 'gradeAccuracyArgument' must explicitly mention which learning goals were focused on and how the work's fulfillment (or lack thereof) aligns with the specific terminology of the scale (e.g., "omfattende", "udtømmende", "adskillige mangler").

**Input Data:**
- Studieordning: {{{studyRegulations}}}
- Eksamensbestemmelser: {{{examRegulations}}}
- Opgavebesvarelse: {{{assignmentText}}}
- Modtaget karakter: {{{grade}}}
- Eventuel feedback: {{{feedback}}}
`,
  config: {
    temperature: 0.2,
    safetySettings: [
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_LOW_AND_ABOVE' },
    ],
  },
});

const secondOpinionFlow = ai.defineFlow(
  {
    name: 'secondOpinionFlow',
    inputSchema: SecondOpinionInputSchema,
    outputSchema: SecondOpinionOutputSchema,
  },
  async (input) => {
    const { output, usage } = await prompt(input);
    return {
      data: output!,
      usage: {
        inputTokens: usage.inputTokens,
        outputTokens: usage.outputTokens,
      },
      input: input,
    };
  }
);
