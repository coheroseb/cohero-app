// @ts-nocheck
import { ai } from '@/ai/genkit';
import {
    ScanStudentCardInputSchema,
    ScanStudentCardOutputSchema,
    type ScanStudentCardInput,
    type ScanStudentCardOutput,
} from './types';

export async function scanStudentCard(input: ScanStudentCardInput): Promise<ScanStudentCardOutput> {
  return scanStudentCardFlow(input);
}

const scanStudentCardFlow = ai.defineFlow(
  {
    name: 'scanStudentCardFlow',
    inputSchema: ScanStudentCardInputSchema,
    outputSchema: ScanStudentCardOutputSchema,
  },
  async (input) => {
    const { imageUrl, userFullName } = input;
    
    // We use a structured prompt with the image
    const response = await ai.generate({
      model: 'googleai/gemini-1.5-flash',
      prompt: [
        { text: `You are a verification assistant for Cohéro. 
Your task is to analyze the provided image of a student card. 
The user's recorded full name is: "${userFullName}".

Please extract the following information:
1. Is this actually a student card? (isStudentCard)
2. What is the full name written on the card? (nameOnCard)
3. What is the expiration date on the card? (expiryDate) - respond in DD-MM-YYYY format if possible, or a string like "End of 2025".
4. Based on today's date (${new Date().toISOString().split('T')[0]}), is the card expired? (isExpired)
5. Does the name on the card mismatch the recorded name "${userFullName}"? (nameMismatch) - minor differences like middle names are okay, but different last names or completely different names are a mismatch.
6. Your confidence score from 0.0 to 1.0 (confidence)

Return the result as a JSON object.` },
        { media: { url: imageUrl, contentType: 'image/jpeg' } } // Works for most images, Gemini handles it
      ],
      output: {
        schema: ScanStudentCardOutputSchema.shape.data
      }
    });

    const result = response.output();
    const usage = response.usage();

    return {
      data: result,
      usage: {
        inputTokens: usage.inputTokens || 0,
        outputTokens: usage.outputTokens || 0
      }
    };
  }
);
