// @ts-nocheck

/**
 * @fileOverview An AI flow to extract structured tasks from a text document.
 * - extractTasksFromText - Analyzes text and returns a list of tasks.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const TaskExtractionInputSchema = z.object({
  text: z.string().describe("The text content extracted from a document."),
});
export type TaskExtractionInput = z.infer<typeof TaskExtractionInputSchema>;

const ExtractedTaskSchema = z.object({
  title: z.string().describe("A concise title for the task."),
  description: z.string().describe("A brief description of the task based on the context."),
  dueDate: z.string().optional().describe("A potential deadline found in the text (YYYY-MM-DD)."),
});

const TaskExtractionOutputSchema = z.object({
  tasks: z.array(ExtractedTaskSchema),
});
export type TaskExtractionOutput = z.infer<typeof TaskExtractionOutputSchema>;

export async function extractTasksFromText(input: TaskExtractionInput): Promise<TaskExtractionOutput> {
  return extractTasksFlow(input);
}

const extractTasksFlow = ai.defineFlow(
  {
    name: 'extractTasksFlow',
    inputSchema: TaskExtractionInputSchema,
    outputSchema: TaskExtractionOutputSchema,
  },
  async (input) => {
    // Truncate input text to avoid token limits for large PDFs
    const truncatedText = input.text.substring(0, 10000);

    const { output } = await ai.generate({
      output: { schema: TaskExtractionOutputSchema },
      system: "Du er en ekspert i projektledelse for studiegrupper. Din opgave er at analysere en tekst og udtrække en liste over konkrete opgaver. For hver opgave skal du lave en præcis titel og en kort beskrivelse. Hvis du finder en dato, der ligner en deadline, skal du inkludere den i YYYY-MM-DD format. Svar på dansk.",
      prompt: `Udtræk opgaver fra følgende tekst:\n\n${truncatedText}`,
    });

    return output!;
  }
);
