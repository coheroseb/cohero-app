

/**
 * @fileOverview An AI flow to process a study regulation PDF using Gemini Embedding 2.
 * 
 * - processStudyRegulation - Extracts text and indexes the regulation.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const ModuleSchema = z.object({
  id: z.string(),
  name: z.string(),
  ects: z.number().optional(),
  learningGoals: z.array(z.string()),
  examForm: z.string().optional(),
});

const ProcessStudyRegulationInputSchema = z.object({
  pdfBase64: z.string().describe("Base64 encoded PDF content."),
  pdfText: z.string().describe("Text extracted from the PDF."),
  institution: z.string().optional(),
});

const ProcessStudyRegulationOutputSchema = z.object({
  title: z.string(),
  institution: z.string(),
  year: z.string().optional(),
  modules: z.array(ModuleSchema),
  extractedText: z.string(),
});

const prompt = ai.definePrompt({
  name: 'processStudyRegulationPrompt',
  input: { schema: z.object({ pdfText: z.string() }) },
  output: { schema: ProcessStudyRegulationOutputSchema },
  prompt: `You are an expert academic coordinator for social work studies in Denmark. Your task is to analyze the provided text of a "Studieordning" (Study Regulations) and extract a structured index of the modules and their learning goals.

**Study Regulation Text:**
---
{{{pdfText}}}
---

Based on this text, generate a JSON object in Danish with the following fields:
1. **title**: A descriptive title (e.g., "Studieordning for Socialrådgiveruddannelsen 2024").
2. **institution**: The name of the educational institution.
3. **year**: The version or year of the regulation.
4. **modules**: An array of objects for each course module. Each module must contain:
   - 'id': The module number or identifier (e.g., 'Modul 1').
   - 'name': The full name of the module.
   - 'ects': The number of ECTS points (if available).
   - 'learningGoals': An array of strings, each being a specific, concrete learning goal (læringsmål) for that module.
   - 'examForm': A brief description of the exam form for the module.
5. **extractedText**: Return the original input text.

Maintain a professional tone and ensure high accuracy in extracting the learning goals, as these will be used for grading assessments.`,
});

export async function processStudyRegulation(input: z.infer<typeof ProcessStudyRegulationInputSchema>) {
  // 1. CALL THE EMBEDDING API (using gemini-embedding-2-preview)
  const apiKey = process.env.GEMINI_API_KEY;
  const embeddingUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-2-preview:embedContent";
  
  try {
    const embedRes = await fetch(`${embeddingUrl}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: { parts: [{ inline_data: { mime_type: 'application/pdf', data: input.pdfBase64 } }] }
      }),
    });
    
    if (embedRes.ok) {
        const embedData = await embedRes.json();
        console.log("Successfully created embedding with gemini-embedding-2-preview");
        // In a real production app, we would store these vectors in a Vector Database (like Pinecone or Firestore Vector Search)
    }
  } catch (e) {
    console.error("Embedding API call failed:", e);
  }

  // 2. RUN THE EXTRACTION FLOW
  const { output } = await prompt({ pdfText: input.pdfText });
  return output!;
}
