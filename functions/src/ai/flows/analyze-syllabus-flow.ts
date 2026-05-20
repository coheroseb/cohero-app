// @ts-nocheck
import axios from 'axios';
import { ai } from '../genkit';
import { AnalyzeSyllabusInputSchema, AnalyzeSyllabusOutputSchema, type AnalyzeSyllabusInput, type AnalyzeSyllabusOutput } from './types';
import * as admin from 'firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function analyzeSyllabus(input: AnalyzeSyllabusInput): Promise<AnalyzeSyllabusOutput> {
  return analyzeSyllabusFlow(input);
}

export const analyzeSyllabusFlow = ai.defineFlow(
  {
    name: 'analyzeSyllabusFlow',
    inputSchema: AnalyzeSyllabusInputSchema,
    outputSchema: AnalyzeSyllabusOutputSchema,
  },
  async (input) => {
    let mediaObj;
    try {
      console.log(`[analyzeSyllabusFlow] Fetching file from URL: ${input.fileUrl}`);
      const response = await axios.get(input.fileUrl, { responseType: 'arraybuffer' });
      const base64 = Buffer.from(response.data).toString('base64');
      mediaObj = { media: { url: `data:application/pdf;base64,${base64}`, contentType: 'application/pdf' } };
      console.log(`[analyzeSyllabusFlow] Successfully fetched and converted to base64. Length: ${base64.length}`);
    } catch (e: any) {
      console.error("[analyzeSyllabusFlow] Failed to fetch PDF for analysis:", e.message);
      throw new Error("Kunne ikke hente pensum-dokumentet til analyse.");
    }

    let output, usage;
    try {
        const genResult = await ai.generate({
          model: 'googleai/gemini-3.5-flash',
          prompt: [
            mediaObj,
            {
              text: `Du er en pædagogisk ekspert og studievejleder. Din opgave er at læse et pensum-dokument (PDF) og koble det til officielle læringsmål for en socialrådgiver- eller pædagoguddannelse.
    
    **Dokument Navn:** ${input.fileName}
    **Læringsmål:**
    ${input.learningGoals.map((goal, i) => `${i + 1}. ${goal}`).join('\n')}
    
    **Din opgave (på dansk):**
    1. Læs dokumentet og giv en kort, motiverende sammenfatning af, hvad det handler om (summary).
    2. For hvert læringsmål, vurder om dokumentet er relevant.
    3. Hvis relevant, angiv en faglig begrundelse (reason) og de specifikke sider eller kapitler (pages), hvor den studerende bør læse nærmere.
    
    **Dit svar SKAL være et JSON-objekt med 'summary' og 'goalMapping' (en liste af objekter med goalIndex, reason, pages).`
            }
          ],
          output: { schema: AnalyzeSyllabusOutputSchema.shape.data },
          config: {
            safetySettings: [
              { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
              { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
              { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
              { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_LOW_AND_ABOVE' },
            ],
          },
        });
        output = genResult.output;
        usage = genResult.usage;
    } catch (e: any) {
        console.error("[analyzeSyllabusFlow] AI Generation failed:", e.message);
        throw new Error(`AI Analyse fejlede: ${e.message}`);
    }
    
    console.log(`[analyzeSyllabusFlow] AI Generation completed. Usage:`, usage);
    
    const result = {
      data: output!,
      usage: {
        inputTokens: usage.inputTokens || 0,
        outputTokens: usage.outputTokens || 0,
      },
    };
    
    console.log(`[analyzeSyllabusFlow] Result summary length: ${result.data.summary?.length || 0}`);

    // Update Firestore with the analysis results
    try {
        const materialPath = `users/${input.userId}/materials/${input.materialId}`;
        console.log(`[analyzeSyllabusFlow] Updating Firestore document at: ${materialPath}`);
        
        await (admin.firestore as any)(undefined, process.env.NEXT_PUBLIC_FIREBASE_DATABASE_ID || "(default)")
            .collection('users')
            .doc(input.userId)
            .collection('materials')
            .doc(input.materialId)
            .set({
                isAnalyzed: true,
                aiSummary: result.data.summary,
                goalMapping: result.data.goalMapping,
                analyzedAt: FieldValue.serverTimestamp()
            }, { merge: true });
            
        console.log(`[analyzeSyllabusFlow] Successfully updated ${materialPath}`);
    } catch (e) {
        console.error(`[analyzeSyllabusFlow] Failed to update material ${input.materialId}:`, e);
    }

    return result;
  }
);
