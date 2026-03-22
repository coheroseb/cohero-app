// @ts-nocheck

import { ai } from '@/ai/genkit';
import {
  ExtractApaMetadataInputSchema,
  ExtractApaMetadataOutputSchema,
  ApaMetadataSchema,
  type ExtractApaMetadataInput,
  type ExtractApaMetadataOutput,
} from './types';

export async function extractApaMetadata(input: ExtractApaMetadataInput): Promise<ExtractApaMetadataOutput> {
  return extractApaMetadataFlow(input);
}

const prompt = ai.definePrompt({
  name: 'extractApaMetadataPrompt',
  input: { schema: ExtractApaMetadataInputSchema },
  output: { schema: ApaMetadataSchema },
  prompt: `You are an expert academic librarian and APA 7th edition specialist. 
Your task is to extract bibliographic metadata from the provided document text and format it into a valid APA 7 reference.

Document Filename: "{{{fileName}}}"
Document Content Snippet:
"""
{{{fileContent}}}
"""

Please identify:
1. Authors (Formatted as: Surname, I., & Surname, I.)
2. Year of publication (If not found, use "n.d.")
3. Title of the work (Use sentence case as per APA)
4. Source/Publisher (e.g. journal name, website name, or organization)
5. URL (If applicable and found)
6. DOI (If applicable and found)

Construct a "fullAPA" string that represents the complete citation.
Example: Jensen, A. (2024). Socialt arbejde i praksis. Samfundslitteratur. https://doi.org/10.1000/123

If information is missing, use your best academic judgment or "n.d." for year.
Return the result as a JSON object matching the requested schema.`,
});

const extractApaMetadataFlow = ai.defineFlow(
  {
    name: 'extractApaMetadataFlow',
    inputSchema: ExtractApaMetadataInputSchema,
    outputSchema: ExtractApaMetadataOutputSchema,
  },
  async (input) => {
    // We only take the first 10000 characters to avoid token limits and focus on metadata headers
    const truncatedContent = input.fileContent.substring(0, 10000);
    
    const { output, usage } = await prompt({
        ...input,
        fileContent: truncatedContent
    });

    return {
      data: output!,
      usage: {
        inputTokens: usage.inputTokens ?? 0,
        outputTokens: usage.outputTokens ?? 0,
      },
    };
  }
);
