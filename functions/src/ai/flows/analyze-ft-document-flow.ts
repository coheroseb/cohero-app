// @ts-nocheck


/**
 * @fileOverview An AI flow to analyze the text content of a legal document.
 * - analyzeFtDocument - Analyzes the document's text.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import {
  AnalyzeFtDocumentInputSchema,
  AnalyzeFtDocumentDataSchema,
  AnalyzeFtDocumentOutputSchema,
  type AnalyzeFtDocumentInput,
  type AnalyzeFtDocumentOutput,
} from './types';


export async function analyzeFtDocument(input: AnalyzeFtDocumentInput): Promise<AnalyzeFtDocumentOutput> {
  return analyzeFtDocumentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeFtDocumentPrompt',
  input: { schema: AnalyzeFtDocumentInputSchema },
  output: { schema: AnalyzeFtDocumentDataSchema },
  prompt: `You are an expert political analyst and educator for Danish social work students. Your task is to provide a pedagogical explanation of the document found at the URL provided below.

**CRITICAL INSTRUCTION:** You MUST first access the content from the provided URL. Then, base your entire analysis on the content you have retrieved from that URL.

The document URL is: {{{documentUrl}}}
The document title is: "{{{documentTitle}}}"

Based on the content from the URL, please provide an explanation in Danish, formatted with simple HTML tags like \`<h3>\`, \`<p>\`, and \`<ul>/<li>\`. Your explanation should cover:

1.  **Hvad handler dokumentet om?** (Summarize the core issue in plain language).
2.  **Hvorfor er det relevant for en socialrådgiver?** (Explain the practical implications for social work).
3.  **Hvad er hovedpointerne?** (List the main arguments or changes being discussed).

Your entire response must be a single JSON object with a single key: "explanation".`,
});

const analyzeFtDocumentFlow = ai.defineFlow(
  {
    name: 'analyzeFtDocumentFlow',
    inputSchema: AnalyzeFtDocumentInputSchema,
    outputSchema: AnalyzeFtDocumentOutputSchema,
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
