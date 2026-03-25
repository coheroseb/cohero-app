import { ai } from '@/ai/genkit';
import * as admin from 'firebase-admin';
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
  async (input: any) => {
    try {
        console.log("ScanStudentCard Input raw:", JSON.stringify(input));
        
        // Explicitly handle input being null or undefined
        const safeInput = input || {};
        const rawImageUrl = safeInput.imageUrl;
        const imageUrl = typeof rawImageUrl === 'string' ? rawImageUrl : "";
        
        if (!imageUrl) {
            console.warn("ScanStudentCard: Missing imageUrl in input");
            return {
                data: {
                    isStudentCard: false,
                    nameOnCard: "Ingen fil sti",
                    expiryDate: "N/A",
                    isExpired: false,
                    nameMismatch: false,
                    confidence: 0,
                    error: "Image URL missing"
                }, 
                usage: { inputTokens: 0, outputTokens: 0 }
            };
        }

        const userFullName = typeof safeInput.userFullName === 'string' ? safeInput.userFullName : "Unknown";
        
        let imageBuffer: Buffer;
        if (imageUrl.startsWith('student_cards/')) {
            const bucket = admin.storage().bucket();
            const file = bucket.file(imageUrl);
            const [buffer] = await file.download();
            imageBuffer = buffer;
        } else {
            const res = await fetch(imageUrl);
            if (!res.ok) throw new Error(`Kunne ikke hente billede fra URL: ${res.statusText}`);
            imageBuffer = Buffer.from(await res.arrayBuffer());
        }

        const mediaPart = { 
            media: {
                url: `data:image/jpeg;base64,${imageBuffer.toString('base64')}`, 
                contentType: 'image/jpeg' 
            }
        };

        // We use a structured prompt with the image
        const response = await ai.generate({
          model: 'googleai/gemini-2.5-flash',
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
            mediaPart 
          ],
          output: {
            schema: ScanStudentCardOutputSchema.shape.data
          }
        });

        const result = response.output;
        const usage = response.usage;

        return {
          data: result as any,
          usage: {
            inputTokens: usage?.inputTokens || 0,
            outputTokens: usage?.outputTokens || 0
          }
        };
    } catch (err: any) {
        console.error("ScanStudentCard CRASHED:", err);
        throw new Error(`CRASH [${err.message}] at ${err.stack}`);
    }
  }
);
