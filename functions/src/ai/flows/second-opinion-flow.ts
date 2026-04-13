// @ts-nocheck

/**
 * @fileOverview An AI-powered tool to assess if there is a basis for a grade complaint.
 *
 * - getSecondOpinion - A function that analyzes a student work against grading criteria.
 * - SecondOpinionInput - The input type for the getSecondOpinion function.
 * - SecondOpinionOutput - The return type for the getSecondOpinion function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const SecondOpinionInputSchema = z.object({
  studyRegulations: z.string().describe("The relevant sections of the study regulations or course description, including learning objectives."),
  examRegulations: z.string().describe("The relevant sections of the exam regulations."),
  assignmentText: z.string().optional().describe("The text content of the assignment (if already extracted)."),
  assignmentPdf: z.string().optional().describe("The base64 encoded PDF of the assignment for direct multimodal analysis."),
  grade: z.string().optional().describe('The grade the social work student received, if any (e.g., "7", "10").'),
  feedback: z.string().optional().describe("Optional feedback from the examiner."),
  decisionContext: z.string().optional().describe("Contextual information from similar previous decisions to help the AI understand outcome patterns."),
  mode: z.enum(['audit', 'feedback']).optional().default('audit').describe("The mode of analysis: 'audit' for checking an existing grade, 'feedback' for assessing an ungraded work."),
});

export type SecondOpinionInput = z.infer<typeof SecondOpinionInputSchema>;

const AnalysisSchema = z.object({
  isComplaintJustified: z.boolean().describe('A boolean indicating whether there is a plausible basis for a complaint.'),
  isGradeAccurate: z.boolean().describe('A boolean indicating if the given grade is considered accurate/fair based on the analysis. In feedback mode, set this to true if you are confident in your suggestion.'),
  suggestedGrade: z.string().optional().describe("The grade you suggest for the work (e.g., '7', '10', '12'). Mandatory in 'feedback' mode."),
  gradeAccuracyArgument: z.string().describe("A detailed, concrete argument explaining your assessment. Reference specific parts of the assignment and learning goals. Use HTML for formatting."),

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

const secondOpinionFlow = ai.defineFlow(
  {
    name: 'secondOpinionFlow',
    inputSchema: SecondOpinionInputSchema,
    outputSchema: SecondOpinionOutputSchema,
  },
  async (input) => {
    const { output, usage } = await ai.generate({
      output: { schema: AnalysisSchema },
      prompt: [
        { text: `You are an impartial and expert external examiner (censor) and university lecturer in the Danish higher education system. Your task is to provide a highly concrete, document-based analysis of a student's graded assignment.

**YOUR OBJECTIVE (MODE: ${input.mode}):**
- **Hvis mode er 'audit':** Afgør om den modtagne karakter (${input.grade}) er retvisende i forhold til opgavens kvalitet og læringsmålene. Indstil 'suggestedGrade' til din vurdering af den korrekte karakter.
- **Hvis mode er 'feedback':** Analysér opgavens kvalitet i forhold til læringsmålene og giv en præcis vurdering af, hvilken karakter arbejdet vil lande på i 'suggestedGrade'. Fokusér her på pædagogisk feedback og konkrete forbedringsforslag.

**YOUR PHILOSOPHY:**
You are a conservative, strict, but fair examiner. Your goal is to ensure students are not misled into false hope. If an assignment is on the border between two grades, you must select the lower grade. Always prioritize evidence of deep understanding and critical thinking over simple repetition of theory. Be critical of documentation, hierarchy of sources, and the logical 'red thread' in the work.

**CRITICAL REQUIREMENT:**
You MUST use the specific learning objectives (læringsmål) and exam criteria provided in the 'studyRegulations' and 'examRegulations' as your absolute reference point. Your assessment should reflect exactly how well the work fulfills these specific requirements for the current semester and module. Disregard any general knowledge that contradicts the specific goals provided.

**7-TRINS-SKALAEN (Grading Scale):**
- 12 (Den fremragende præstation), 10 (Den fortrinlige), 7 (Den gode), 4 (Den jævne), 02 (Den tilstrækkelige), 00 (Den utilstrækkelige), -3 (Den ringe).

**OUTPUT REQUIREMENTS:**
- All output must be in Danish. 
- Use simple HTML tags (<p>, <strong>, <ul>, <li>) in the 'gradeAccuracyArgument'.

**Input Data:**
- Studieordning: ${input.studyRegulations}
- Eksamensbestemmelser: ${input.examRegulations}
- Modtaget karakter: ${input.grade}
- Eventuel feedback: ${input.feedback}
- Mode: ${input.mode}

**Kontekst fra tidligere afgørelser:**
${input.decisionContext || 'Ingen historisk kontekst fundet.'}

Analysér den vedhæftede opgave herunder i forhold til ovenstående instruktioner:` },
        ...(input.assignmentPdf ? [{ media: { url: `data:application/pdf;base64,${input.assignmentPdf}`, contentType: 'application/pdf' } }] : []),
        ...(input.assignmentText ? [{ text: `OPGAVETEKST:\n${input.assignmentText}` }] : [])
      ],
      config: {
        temperature: 0.2,
      }
    });

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
